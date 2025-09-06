import * as XLSX from 'xlsx';

export interface ExcelColumn {
  key: string;
  label: string;
  width?: number;
}

export const downloadExcel = (
  data: any[],
  columns: ExcelColumn[],
  filename: string
) => {
  try {
    // 헤더 생성
    const headers = columns.map(col => col.label);
    
    // 데이터 변환
    const excelData = data.map(item => {
      const row: any = {};
      columns.forEach(col => {
        let value = item[col.key];
        
        // 날짜 형식 처리
        if (value && typeof value === 'string' && value.includes('T')) {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            value = date.toLocaleDateString('ko-KR');
          }
        }
        
        // 객체 내 값 처리 (예: createdBy.name)
        if (col.key.includes('.')) {
          const keys = col.key.split('.');
          let nestedValue = item;
          for (const key of keys) {
            nestedValue = nestedValue?.[key];
          }
          value = nestedValue;
        }
        
        // Boolean 값 처리
        if (typeof value === 'boolean') {
          value = value ? '예' : '아니오';
        }
        
        // null, undefined 처리
        if (value === null || value === undefined) {
          value = '';
        }
        
        row[col.label] = value;
      });
      return row;
    });
    
    // 워크북 생성
    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    
    // 열 너비 설정
    const colWidths = columns.map(col => ({
      wch: col.width || 15
    }));
    ws['!cols'] = colWidths;
    
    // 워크시트 추가
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    
    // 파일 다운로드
    const now = new Date();
    const timestamp = now.toISOString().slice(0, 19).replace(/[:]/g, '-');
    const fullFilename = `${filename}_${timestamp}.xlsx`;
    
    XLSX.writeFile(wb, fullFilename);
    
    return true;
  } catch (error) {
    console.error('Excel download error:', error);
    return false;
  }
};

// 날짜 범위 필터링을 위한 유틸리티
export const filterDataByDateRange = (
  data: any[],
  dateField: string,
  startDate?: string,
  endDate?: string
) => {
  if (!startDate && !endDate) return data;
  
  return data.filter(item => {
    const itemDate = new Date(item[dateField]);
    if (isNaN(itemDate.getTime())) return true;
    
    if (startDate) {
      const start = new Date(startDate);
      if (itemDate < start) return false;
    }
    
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // 해당 날짜 끝까지 포함
      if (itemDate > end) return false;
    }
    
    return true;
  });
};