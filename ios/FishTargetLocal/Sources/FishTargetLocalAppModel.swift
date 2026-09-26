import Combine
import Foundation

@MainActor
final class FishTargetLocalAppModel: ObservableObject {
    enum State: Equatable {
        case checking
        case needsModel
        case downloading
        case loading
        case ready
        case failed(String)
    }

    @Published private(set) var state: State = .checking
    @Published private(set) var controller: FieldCoachController?

    private var store: ModelStore?

    var webIndexURL: URL? {
        Bundle.main.url(forResource: "index", withExtension: "html", subdirectory: "WebApp")
    }

    func bootstrap() async {
        guard state == .checking else { return }

        do {
            let store = try ModelStore()
            self.store = store

            guard webIndexURL != nil else {
                state = .failed("WebApp/index.html がありません。bootstrap.sh を実行してからXcodeプロジェクトを生成してください。")
                return
            }

            let descriptor = LocalModelCatalog.fieldCoach
            if await store.exists(named: descriptor.fileName) {
                await loadModel()
            } else {
                state = .needsModel
            }
        } catch {
            state = .failed("初期化に失敗: \(error)")
        }
    }

    func installModel() async {
        guard let store else {
            state = .failed("ModelStore が初期化されていません。")
            return
        }

        state = .downloading
        do {
            let descriptor = LocalModelCatalog.fieldCoach
            _ = try await store.download(
                from: descriptor.downloadURL,
                fileName: descriptor.fileName,
                expectedSHA256: descriptor.sha256
            )
            await loadModel()
        } catch {
            state = .failed("モデル取得に失敗: \(error)")
        }
    }

    func retry() async {
        controller = nil
        state = .checking
        await bootstrap()
    }

    private func loadModel() async {
        guard let store else {
            state = .failed("ModelStore が初期化されていません。")
            return
        }

        state = .loading
        do {
            let url = await store.modelURL(named: LocalModelCatalog.fieldCoach.fileName)
            let engine = try await Task.detached(priority: .userInitiated) {
                try LlamaFieldCoachEngine(modelURL: url)
            }.value
            controller = FieldCoachController(engine: engine)
            state = .ready
        } catch {
            state = .failed("モデル読込に失敗: \(error)")
        }
    }
}
