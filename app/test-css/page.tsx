export default function TestCSSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-8 text-center">
          CSS 스타일 테스트
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {/* Card 1 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-blue-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Primary Colors</h3>
            <p className="text-gray-600">파랑색 계열 테스트</p>
          </div>
          
          {/* Card 2 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-green-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Success Colors</h3>
            <p className="text-gray-600">초록색 계열 테스트</p>
          </div>
          
          {/* Card 3 */}
          <div className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
            <div className="w-12 h-12 bg-red-500 rounded-full mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Danger Colors</h3>
            <p className="text-gray-600">빨강색 계열 테스트</p>
          </div>
        </div>
        
        {/* Buttons */}
        <div className="flex flex-wrap gap-4 mb-8">
          <button className="px-6 py-3 bg-primary-600 text-white rounded-md hover:bg-primary-700 transition-colors">
            Primary Button
          </button>
          <button className="px-6 py-3 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">
            Secondary Button
          </button>
          <button className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors">
            Success Button
          </button>
          <button className="px-6 py-3 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">
            Danger Button
          </button>
        </div>
        
        {/* Form Elements */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <h3 className="text-xl font-semibold mb-4">Form Elements</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Text Input
              </label>
              <input 
                type="text" 
                placeholder="텍스트를 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Box
              </label>
              <select className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500">
                <option>옵션 1</option>
                <option>옵션 2</option>
                <option>옵션 3</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Textarea
              </label>
              <textarea 
                rows={4}
                placeholder="내용을 입력하세요"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* Alert Messages */}
        <div className="space-y-4 mb-8">
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">정보</h3>
                <p className="text-sm text-blue-700">이것은 정보 메시지입니다.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">성공</h3>
                <p className="text-sm text-green-700">작업이 성공적으로 완료되었습니다.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">경고</h3>
                <p className="text-sm text-yellow-700">주의가 필요한 상황입니다.</p>
              </div>
            </div>
          </div>
          
          <div className="bg-red-50 border border-red-200 rounded-md p-4">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">오류</h3>
                <p className="text-sm text-red-700">오류가 발생했습니다.</p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Typography */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-xl font-semibold mb-4">Typography</h3>
          <div className="space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">제목 1 (text-4xl)</h1>
            <h2 className="text-3xl font-bold text-gray-900">제목 2 (text-3xl)</h2>
            <h3 className="text-2xl font-bold text-gray-900">제목 3 (text-2xl)</h3>
            <h4 className="text-xl font-semibold text-gray-900">제목 4 (text-xl)</h4>
            <h5 className="text-lg font-medium text-gray-900">제목 5 (text-lg)</h5>
            <h6 className="text-base font-medium text-gray-900">제목 6 (text-base)</h6>
            <p className="text-gray-600">
              일반 텍스트입니다. 이것은 단락 형태의 내용을 표시하는데 사용됩니다.
            </p>
            <p className="text-sm text-gray-500">
              작은 텍스트 (text-sm)
            </p>
            <p className="text-xs text-gray-400">
              매우 작은 텍스트 (text-xs)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}