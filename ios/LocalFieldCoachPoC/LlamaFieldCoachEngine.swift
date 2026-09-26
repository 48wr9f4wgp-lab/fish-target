import Foundation
import llama

private func batchClear(_ batch: inout llama_batch) {
    batch.n_tokens = 0
}

private func batchAdd(
    _ batch: inout llama_batch,
    token: llama_token,
    position: llama_pos,
    logits: Bool
) {
    let index = Int(batch.n_tokens)
    batch.token[index] = token
    batch.pos[index] = position
    batch.n_seq_id[index] = 1
    batch.seq_id[index]![0] = 0
    batch.logits[index] = logits ? 1 : 0
    batch.n_tokens += 1
}

actor LlamaFieldCoachEngine: LocalLLMEngine {
    private var model: OpaquePointer?
    private var context: OpaquePointer?
    private var vocab: OpaquePointer?
    private var sampler: UnsafeMutablePointer<llama_sampler>?
    private var batch: llama_batch

    init(modelURL: URL) throws {
        llama_backend_init()

        var modelParams = llama_model_default_params()
        #if targetEnvironment(simulator)
        modelParams.n_gpu_layers = 0
        #else
        modelParams.n_gpu_layers = 99
        #endif

        guard let loadedModel = llama_model_load_from_file(modelURL.path, modelParams) else {
            throw LocalLLMEngineError.modelNotLoaded
        }

        let cpu = ProcessInfo.processInfo.processorCount
        let threads = max(1, min(4, cpu - 2))
        var contextParams = llama_context_default_params()
        contextParams.n_ctx = 2048
        contextParams.n_threads = Int32(threads)
        contextParams.n_threads_batch = Int32(threads)

        guard let loadedContext = llama_init_from_model(loadedModel, contextParams) else {
            llama_model_free(loadedModel)
            throw LocalLLMEngineError.modelNotLoaded
        }

        let samplerParams = llama_sampler_chain_default_params()
        let samplerChain = llama_sampler_chain_init(samplerParams)
        llama_sampler_chain_add(samplerChain, llama_sampler_init_temp(0.2))
        llama_sampler_chain_add(samplerChain, llama_sampler_init_dist(0xF15C0A))

        model = loadedModel
        context = loadedContext
        vocab = llama_model_get_vocab(loadedModel)
        sampler = samplerChain
        batch = llama_batch_init(512, 0, 1)
    }

    deinit {
        if let sampler { llama_sampler_free(sampler) }
        llama_batch_free(batch)
        if let context { llama_free(context) }
        if let model { llama_model_free(model) }
        llama_backend_free()
    }

    func complete(prompt: String, maxTokens: Int = 120) async throws -> String {
        guard let context, let vocab, let sampler else {
            throw LocalLLMEngineError.modelNotLoaded
        }

        llama_memory_clear(llama_get_memory(context), true)
        llama_sampler_reset(sampler)

        let promptTokens = tokenize(prompt, vocab: vocab)
        guard !promptTokens.isEmpty else { throw LocalLLMEngineError.inferenceFailed }

        batchClear(&batch)
        for (index, token) in promptTokens.enumerated() {
            batchAdd(&batch, token: token, position: Int32(index), logits: index == promptTokens.count - 1)
        }
        guard llama_decode(context, batch) == 0 else {
            throw LocalLLMEngineError.inferenceFailed
        }

        var position = Int32(promptTokens.count)
        var bytes: [CChar] = []
        var output = ""

        for _ in 0..<max(1, min(maxTokens, 160)) {
            let token = llama_sampler_sample(sampler, context, batch.n_tokens - 1)
            if llama_vocab_is_eog(vocab, token) { break }

            bytes.append(contentsOf: tokenPiece(token, vocab: vocab))
            if let chunk = String(validatingUTF8: bytes + [0]) {
                output += chunk
                bytes.removeAll(keepingCapacity: true)
            }

            batchClear(&batch)
            batchAdd(&batch, token: token, position: position, logits: true)
            guard llama_decode(context, batch) == 0 else {
                throw LocalLLMEngineError.inferenceFailed
            }
            position += 1
        }

        if !bytes.isEmpty {
            output += String(cString: bytes + [0])
        }

        let trimmed = output.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw LocalLLMEngineError.emptyOutput }
        return trimmed
    }

    private func tokenize(_ text: String, vocab: OpaquePointer) -> [llama_token] {
        let utf8Count = text.utf8.count
        let capacity = utf8Count + 8
        let buffer = UnsafeMutablePointer<llama_token>.allocate(capacity: capacity)
        defer { buffer.deallocate() }
        let count = llama_tokenize(vocab, text, Int32(utf8Count), buffer, Int32(capacity), true, false)
        guard count > 0 else { return [] }
        return (0..<Int(count)).map { buffer[$0] }
    }

    private func tokenPiece(_ token: llama_token, vocab: OpaquePointer) -> [CChar] {
        var small = [CChar](repeating: 0, count: 16)
        let count = llama_token_to_piece(vocab, token, &small, Int32(small.count), 0, false)
        if count >= 0 {
            return Array(small.prefix(Int(count)))
        }

        var large = [CChar](repeating: 0, count: Int(-count))
        let second = llama_token_to_piece(vocab, token, &large, Int32(large.count), 0, false)
        return second > 0 ? Array(large.prefix(Int(second))) : []
    }
}
