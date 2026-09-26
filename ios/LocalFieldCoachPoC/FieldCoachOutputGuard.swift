import Foundation

enum FieldCoachOutputGuard {
    enum GuardError: Error {
        case emptyOutput
        case inventedNumber(String)
    }

    static func sanitize(_ raw: String, request: FieldCoachRequest) throws -> String {
        var text = raw
        if let regex = try? NSRegularExpression(pattern: "<think>[\\s\\S]*?</think>", options: [.caseInsensitive]) {
            let range = NSRange(text.startIndex..<text.endIndex, in: text)
            text = regex.stringByReplacingMatches(in: text, range: range, withTemplate: "")
        }
        text = text.replacingOccurrences(of: "```", with: "")
        text = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { throw GuardError.emptyOutput }

        let sourceNumbers = numberTokens(in: factsText(request.facts))
        for number in numberTokens(in: text) where !sourceNumbers.contains(number) {
            throw GuardError.inventedNumber(number)
        }

        var normalized = text
        normalized = normalized.replacingOccurrences(of: "。", with: "。\\n")
        normalized = normalized.replacingOccurrences(of: "！", with: "！\\n")
        normalized = normalized.replacingOccurrences(of: "？", with: "？\\n")
        let pieces = normalized
            .components(separatedBy: .newlines)
            .map { $0.trimmingCharacters(in: .whitespacesAndNewlines) }
            .filter { !$0.isEmpty }

        let limit = min(max(request.rules.maxSentences ?? 3, 1), 3)
        let result = pieces.prefix(limit).joined(separator: "\\n")
        guard !result.isEmpty else { throw GuardError.emptyOutput }
        return String(result.prefix(280))
    }

    private static func factsText(_ facts: FieldCoachFacts) -> String {
        let parts = [
            facts.species,
            facts.method,
            facts.requirements?.values.joined(separator: " "),
            facts.firstCast?.values.joined(separator: " "),
            facts.selectedTackle?.values.joined(separator: " ")
        ]
        return parts.compactMap { $0 }.joined(separator: " ")
    }

    private static func numberTokens(in text: String) -> Set<String> {
        guard let regex = try? NSRegularExpression(pattern: "\\d+(?:\\.\\d+)?") else { return [] }
        let range = NSRange(text.startIndex..<text.endIndex, in: text)
        return Set(regex.matches(in: text, range: range).compactMap { match in
            guard let swiftRange = Range(match.range, in: text) else { return nil }
            return String(text[swiftRange])
        })
    }
}
