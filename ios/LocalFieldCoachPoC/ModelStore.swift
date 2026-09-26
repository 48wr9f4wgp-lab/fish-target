import CryptoKit
import Foundation

actor ModelStore {
    enum StoreError: Error {
        case badHTTPStatus(Int)
        case invalidResponse
        case checksumMismatch(expected: String, actual: String)
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

    func download(
        from remoteURL: URL,
        fileName: String,
        expectedSHA256: String? = nil
    ) async throws -> URL {
        let target = modelURL(named: fileName)
        if FileManager.default.fileExists(atPath: target.path) {
            if let expectedSHA256 {
                try verifySHA256(of: target, expected: expectedSHA256)
            }
            return target
        }

        let (temporary, response) = try await URLSession.shared.download(from: remoteURL)
        guard let http = response as? HTTPURLResponse else { throw StoreError.invalidResponse }
        guard (200..<300).contains(http.statusCode) else { throw StoreError.badHTTPStatus(http.statusCode) }

        if let expectedSHA256 {
            try verifySHA256(of: temporary, expected: expectedSHA256)
        }

        try FileManager.default.moveItem(at: temporary, to: target)
        var values = URLResourceValues()
        values.isExcludedFromBackup = true
        var mutableTarget = target
        try mutableTarget.setResourceValues(values)
        return target
    }

    private func verifySHA256(of fileURL: URL, expected: String) throws {
        let handle = try FileHandle(forReadingFrom: fileURL)
        defer { try? handle.close() }

        var hasher = SHA256()
        while true {
            let data = try handle.read(upToCount: 4 * 1024 * 1024) ?? Data()
            if data.isEmpty { break }
            hasher.update(data: data)
        }

        let actual = hasher.finalize().map { String(format: "%02x", $0) }.joined()
        guard actual.caseInsensitiveCompare(expected) == .orderedSame else {
            throw StoreError.checksumMismatch(expected: expected, actual: actual)
        }
    }
}
