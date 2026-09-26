import Foundation

enum FieldCoachPromptBuilder {
    static func build(_ request: FieldCoachRequest) throws -> String {
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        let factsData = try encoder.encode(EncodableFacts(request.facts))
        let factsJSON = String(decoding: factsData, as: UTF8.self)

        let maxSentences = min(max(request.rules.maxSentences ?? 3, 1), 3)
        return """
        あなたは釣りアプリの「説明係」です。判断係ではありません。
        次の確定済みFACTSだけを使い、日本語で現場向けの短い説明を書いてください。

        絶対ルール:
        - 新しい数値、商品、魚種、釣法、条件を追加しない。
        - 計算しない。適合判定しない。安全判定しない。商品を選ばない。
        - FACTSに無い情報は推測しない。
        - 最大(maxSentences)文。
        - プレーンテキストのみ。
        - 情報不足なら、ある情報だけ説明する。

        FACTS:
        (factsJSON)

        回答:
        """
    }

    private struct EncodableFacts: Encodable {
        let species: String?
        let method: String?
        let requirements: [String: String]?
        let firstCast: [String: String]?
        let selectedTackle: [String: String]?

        init(_ facts: FieldCoachFacts) {
            species = facts.species
            method = facts.method
            requirements = facts.requirements
            firstCast = facts.firstCast
            selectedTackle = facts.selectedTackle
        }

        enum CodingKeys: String, CodingKey {
            case species, method, requirements
            case firstCast = "first_cast"
            case selectedTackle = "selected_tackle"
        }
    }
}
