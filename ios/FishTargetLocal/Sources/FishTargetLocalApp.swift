import SwiftUI

@main
struct FishTargetLocalApp: App {
    @StateObject private var appModel = FishTargetLocalAppModel()

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appModel)
                .task {
                    await appModel.bootstrap()
                }
        }
    }
}
