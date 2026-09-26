import Foundation
import WebKit

@MainActor
final class FieldCoachController: NSObject, WKScriptMessageHandler {
    static let handlerName = "fishTargetLocalLLM"

    private let engine: any LocalLLMEngine
    private weak var webView: WKWebView?

    init(engine: any LocalLLMEngine) {
        self.engine = engine
        super.init()
    }

    func makeWebView(configuration: WKWebViewConfiguration = WKWebViewConfiguration()) -> WKWebView {
        configuration.userContentController.add(self, name: Self.handlerName)
        let view = WKWebView(frame: .zero, configuration: configuration)
        webView = view
        return view
    }

    deinit {
        webView?.configuration.userContentController.removeScriptMessageHandler(forName: Self.handlerName)
    }

    func userContentController(_ userContentController: WKUserContentController, didReceive message: WKScriptMessage) {
        guard message.name == Self.handlerName else { return }

        do {
            let data = try JSONSerialization.data(withJSONObject: message.body)
            let request = try JSONDecoder().decode(FieldCoachRequest.self, from: data)
            guard request.schema == 1, request.task == "render_field_coach" else {
                reject(requestID: request.requestId, message: "unsupported-request")
                return
            }

            Task {
                do {
                    let prompt = try FieldCoachPromptBuilder.build(request)
                    let output = try await engine.complete(prompt: prompt, maxTokens: 120)
                    let guarded = try FieldCoachOutputGuard.sanitize(output, request: request)
                    await MainActor.run {
                        resolve(requestID: request.requestId, text: guarded)
                    }
                } catch {
                    await MainActor.run {
                        reject(requestID: request.requestId, message: String(describing: error))
                    }
                }
            }
        } catch {
            // No request id can be trusted if decoding itself failed.
        }
    }

    private func resolve(requestID: String, text: String) {
        evaluateCallback(
            function: "resolve",
            requestID: requestID,
            payload: ["text": text]
        )
    }

    private func reject(requestID: String, message: String) {
        evaluateCallback(
            function: "reject",
            requestID: requestID,
            payload: ["error": message]
        )
    }

    private func evaluateCallback(function: String, requestID: String, payload: [String: String]) {
        guard let webView else { return }
        do {
            let requestData = try JSONSerialization.data(withJSONObject: requestID)
            let payloadData = try JSONSerialization.data(withJSONObject: payload)
            let requestJSON = String(decoding: requestData, as: UTF8.self)
            let payloadJSON = String(decoding: payloadData, as: UTF8.self)
            let js = "globalThis.FISH_TARGET_LOCAL_FIELD_COACH?." + function + "(" + requestJSON + "," + payloadJSON + ")"
            webView.evaluateJavaScript(js)
        } catch {
            // JS callback serialization should never be allowed to crash the host app.
        }
    }
}
