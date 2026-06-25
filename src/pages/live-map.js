export function createMapPage() {
  return async (container) => {
    container.innerHTML = `
      <div class="page" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:60vh;padding:40px;text-align:center">
        <div style="font-size:3rem;margin-bottom:16px;opacity:0.5">🗺</div>
        <h2 style="margin:0 0 8px">活点地图</h2>
        <p style="color:var(--text-muted);max-width:400px">功能开发中，敬请期待</p>
      </div>`;
    return () => {};
  };
}
