import ExpoModulesCore

// Records when the device locks/unlocks via data-protection notifications,
// which fire on lock (passcode devices) but NOT on plain app-switches.
// JS reads the timestamps to tell "phone locked" apart from "went to another app".
public class LockStateModule: Module {
  private var lastLockAt: Double = 0
  private var lastUnlockAt: Double = 0

  public func definition() -> ModuleDefinition {
    Name("LockState")

    OnCreate {
      NotificationCenter.default.addObserver(
        forName: UIApplication.protectedDataWillBecomeUnavailableNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.lastLockAt = Date().timeIntervalSince1970 * 1000
      }
      NotificationCenter.default.addObserver(
        forName: UIApplication.protectedDataDidBecomeAvailableNotification,
        object: nil,
        queue: .main
      ) { [weak self] _ in
        self?.lastUnlockAt = Date().timeIntervalSince1970 * 1000
      }
    }

    Function("getLastLockAt") {
      return self.lastLockAt
    }

    Function("getLastUnlockAt") {
      return self.lastUnlockAt
    }
  }
}
