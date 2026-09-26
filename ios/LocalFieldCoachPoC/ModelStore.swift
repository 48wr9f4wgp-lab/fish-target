import Foundation

actor ModelStore {
    enum StoreError: Error {
        case badHTTPStatus(Int)
        case invalidResponse
    }

    private let directory: URL

    init(fileManager: FileManager = .default) throws {
        let base = try fileManager.url(
            for: .applicationSupportDirectory,
            in: .userDomainMask,
            appropriateFor: nil,
            create: true
        )
        directory = base.appendingPathComponent("FishTargetModels", isDirectory: true)
        try fileManager.createDirectory(at: directory, withIntermediateDirectories: true)
    }

    func modelURL(named fileName: String) -> URL {
        directory.appendingPathComponent(fileName)
    }

    func exists(named fileName: String) -> Bool {
        FileManager.default.fileExists(atPath: modelURL(named: fileName).path)
    }

    func download(from remoteURL: URL, fileName: String) async throws -> URL {
        let target = modelURL(named: fileName)
        if FileManager.default.fileExists(atPath: target.path) { return target }

        let (temporary, response) = try await URLSession.shared.download(from: remoteURL)
        guard let http = response as? HTTPURLResponse else { throw StoreError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw StoreError.badHTTPStatus(http.statusCode) }

        try FileManager.default.moveItem(at: temporary, to: target)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var mutableTarget = target
        try mutableTarget.setResourceValues(values)
        return target
    }
}
