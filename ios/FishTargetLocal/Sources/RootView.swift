import SwiftUI

struct RootView: View {
    @EnvironmentObject private var appModel: FishTargetLocalAppModel

    var body: some View {
        Group {
            switch appModel.state {
            case .ready:
                if let controller = appModel.controller,
                   let indexURL = appModel.webIndexURL {
                    FishTargetWebView(controller: controller, indexURL: indexURL)
                        .ignoresSafeArea()
                } else {
                    failureView("FIELD COACH の起動情報が不足しています。")
                }

            case .checking:
                progressView(title: "準備を確認中", detail: "WebAppとローカルモデルを確認しています。")

            case .needsModel:
                setupView

            case .downloading:
                progressView(
                    title: "LFM2.5 1.2B を取得中",
                    detail: "約731MB。初回だけ通信し、以後は端末内で推論します。"
                )

            case .loading:
                progressView(title: "モデル読込中", detail: "iPhoneのメモリへローカルLLMを展開しています。")

            case .failed(let message):
                failureView(message)
            }
        }
        .background(Color(uiColor: .systemBackground))
    }

    private var setupView: some View {
        VStack(spacing: 18) {
            Image(systemName: "iphone.gen3.radiowaves.left.and.right")
                .font(.system(size: 44, weight: .semibold))
            Text("OFFLINE FIELD COACH")
                .font(.title2.bold())
            Text("fish-targetの判断は既存Resolverが担当。LFM2.5は確定済みデータを3行の日本語へ整えるだけです。")
                .multilineTextAlignment(.center)
                .foregroundStyle(.secondary)
            VStack(alignment: .leading, spacing: 8) {
                Label("モデル: LFM2.5 1.2B Instruct Q4_K_M", systemImage: "cpu")
                Label("容量: 約731MB", systemImage: "internaldrive")
                Label("ライセンス: LFM1.0", systemImage: "doc.text")
                Label("推論: 端末内 / API不要", systemImage: "lock.shield")
            }
            .font(.footnote)
            .frame(maxWidth: .infinity, alignment: .leading)
            Button {
                Task { await appModel.installModel() }
            } label: {
                Text("モデルをインストール")
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 10)
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(24)
    }

    private func progressView(title: String, detail: String) -> some View {
        VStack(spacing: 16) {
            ProgressView()
                .controlSize(.large)
            Text(title)
                .font(.headline)
            Text(detail)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding(28)
    }

    private func failureView(_ message: String) -> some View {
        VStack(spacing: 14) {
            Image(systemName: "exclamationmark.triangle")
                .font(.largeTitle)
            Text("起動できません")
                .font(.headline)
            Text(message)
                .font(.footnote)
                .foregroundStyle(.secondary)
                .multilineTextAlignment(.center)
            Button("再確認") {
                Task { await appModel.retry() }
            }
            .buttonStyle(.borderedProminent)
        }
        .padding(24)
    }
}
