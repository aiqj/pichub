export default function TestPage() {
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold text-primary mb-4">CSS 测试页面</h1>
      <p className="text-brown mb-4">这是一个用于测试CSS样式是否正常工作的页面</p>
      
      <div className="flex flex-col">
        <button className="btn-primary mb-4">
          主要按钮
        </button>
        
        <button className="btn-secondary mb-4">
          次要按钮
        </button>
        
        <div className="card mb-4">
          <h2 className="text-primary font-bold">卡片测试</h2>
          <p className="text-light">这是卡片内容</p>
        </div>
        
        <div className="flex mb-4">
          <div className="card mr-4">Box 1</div>
          <div className="card mr-4">Box 2</div>
          <div className="card">Box 3</div>
        </div>
      </div>
    </div>
  );
} 