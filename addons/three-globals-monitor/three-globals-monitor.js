// window経由で主要な値を常に最新に公開する監視型プラグイン

(function monitorThreeAppGlobals() {
  // 監視対象をまとめる
  let last = {};

  function updateGlobals() {
    // 例: アプリ本体のグローバル管理インスタンス
    const UQ = window.UQ;

    // 安全に値を取得 (存在しない場合はnull)
    const viewer = UQ && UQ._viewer ? UQ._viewer : null;
    const renderer = viewer && viewer.renderer ? viewer.renderer : null;
    const scene = viewer && viewer.scene ? viewer.scene : null;
    const camera = viewer && viewer.camera ? viewer.camera : null;
    const orbitControls = viewer && viewer.orbitControls ? viewer.orbitControls : null;
    // 例: VRMインスタンスや現在のアバター
    const avatar = UQ && UQ._avatar ? UQ._avatar : null;
    const vrm = avatar && avatar._vrm ? avatar._vrm : null;

    // 主要な値をwindowにセット（必要に応じて追加）
    if (window.myThreeRendererInstance !== renderer) {
      window.myThreeRendererInstance = renderer;
      window.dispatchEvent(new CustomEvent("threeRendererChanged", { detail: renderer }));
    }
    if (window.myThreeScene !== scene) {
      window.myThreeScene = scene;
      window.dispatchEvent(new CustomEvent("threeSceneChanged", { detail: scene }));
    }
    if (window.myThreeCamera !== camera) {
      window.myThreeCamera = camera;
      window.dispatchEvent(new CustomEvent("threeCameraChanged", { detail: camera }));
    }
    if (window.myOrbitControls !== orbitControls) {
      window.myOrbitControls = orbitControls;
      window.dispatchEvent(new CustomEvent("orbitControlsChanged", { detail: orbitControls }));
    }
    if (window.myVRMInstance !== vrm) {
      window.myVRMInstance = vrm;
      window.dispatchEvent(new CustomEvent("vrmInstanceChanged", { detail: vrm }));
    }
    if (window.myUQ !== UQ) {
      window.myUQ = UQ;
      window.dispatchEvent(new CustomEvent("UQChanged", { detail: UQ }));
    }

    // 必要なら追加の値も監視
    // 例: window.mySceneBackground = scene && scene.background;

    // 毎フレーム監視
    requestAnimationFrame(updateGlobals);
  }
  updateGlobals();
})();
