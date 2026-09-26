import Foundation

struct LocalModelDescriptor: Sendable {
    let id: String
    let fileName: String
    let downloadURL: URL
    let sha256: String
    let approximateBytes: Int64
    let licenseName: String
}

enum LocalModelCatalog {
    static let fieldCoach = LocalModelDescriptor(
        id: "LiquidAI/LFM2.5-1.2B-Instruct-GGUF:Q4_K_M",
        fileName: "LFM2.5-1.2B-Instruct-Q4_K_M.gguf",
        downloadURL: URL(string: "https://huggingface.co/LiquidAI/LFM2.5-1.2B-Instruct-GGUF/resolve/main/LFM2.5-1.2B-Instruct-Q4_K_M.gguf?download=true")!,
        sha256: "b1b3de114215d9507409a662a501a631095a479a419584e8a2ded6304b19b4f5",
        approximateBytes: 731_000_000,
        licenseName: "LFM1.0"
    )
}
