import Foundation

protocol LocalLLMEngine: Sendable {
    func complete(prompt: String, maxTokens: Int) async throws -> String
}

enum LocalLLMEngineError: Error {
    case modelNotLoaded
    case inferenceFailed
    case emptyOutput
}
