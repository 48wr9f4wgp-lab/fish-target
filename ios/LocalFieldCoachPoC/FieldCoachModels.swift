import Foundation

struct FieldCoachRequest: Decodable, Sendable {
    let schema: Int
    let task: String
    let language: String?
    let requestId: String
    let facts: FieldCoachFacts
    let rules: FieldCoachRules

    enum CodingKeys: String, CodingKey {
        case schema, task, language, facts, rules
        case requestId = "request_id"
    }
}

struct FieldCoachFacts: Decodable, Sendable {
    let species: String?
    let method: String?
    let requirements: [String: String]?
    let firstCast: [String: String]?
    let selectedTackle: [String: String]?

    enum CodingKeys: String, CodingKey {
        case species, method, requirements
        case firstCast = "first_cast"
        case selectedTackle = "selected_tackle"
    }
}

struct FieldCoachRules: Decodable, Sendable {
    let maxSentences: Int?
    let useOnlyFacts: Bool?
    let doNotCalculate: Bool?
    let doNotSelectProducts: Bool?
    let doNotInventNumbers: Bool?
    let plainTextOnly: Bool?

    enum CodingKeys: String, CodingKey {
        case maxSentences = "max_sentences"
        case useOnlyFacts = "use_only_facts"
        case doNotCalculate = "do_not_calculate"
        case doNotSelectProducts = "do_not_select_products"
        case doNotInventNumbers = "do_not_invent_numbers"
        case plainTextOnly = "plain_text_only"
    }
}

struct FieldCoachResponse: Sendable {
    let text: String
}
