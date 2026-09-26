import SwiftUI
import WebKit

struct FishTargetWebView: UIViewRepresentable {
    let controller: FieldCoachController
    let indexURL: URL

    func makeUIView(context: Context) -> WKWebView {
        let configuration = WKWebViewConfiguration()
        configuration.websiteDataStore = .default()
        configuration.allowsInlineMediaPlayback = true

        let webView = controller.makeWebView(configuration: configuration)
        webView.scrollView.contentInsetAdjustmentBehavior = .never

        #if DEBUG
        if #available(iOS 16.4, *) {
            webView.isInspectable = true
        }
        #endif

        let webRoot = indexURL.deletingLastPathComponent()
        webView.loadFileURL(indexURL, allowingReadAccessTo: webRoot)
        return webView
    }

    func updateUIView(_ webView: WKWebView, context: Context) {}
}
