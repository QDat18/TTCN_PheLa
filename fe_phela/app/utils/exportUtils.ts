// Utility functions for exporting reports to Word and Excel

interface RevenueData {
  totalRevenue: number;
  totalOrders: number;
  dailyData: Array<{
    date: string;
    revenue: number;
    orderCount: number;
  }>;
}

// Export to Excel (CSV format)
export const exportToExcel = (data: RevenueData, period: string, periodLabel: string) => {
  const headers = ['Ngày', 'Doanh thu (VND)', 'Số đơn hàng'];
  const rows = data.dailyData.map(item => [
    new Date(item.date).toLocaleDateString('vi-VN'),
    item.revenue.toString(),
    item.orderCount.toString()
  ]);

  // Add summary row
  rows.push(['', '', '']);
  rows.push(['Tổng cộng', data.totalRevenue.toString(), data.totalOrders.toString()]);

  const csvContent = [
    [`Báo cáo Doanh thu - ${periodLabel}`],
    [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}`],
    [''],
    headers,
    ...rows
  ].map(row => row.join(',')).join('\n');

  const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `bao-cao-doanh-thu-${period}-${Date.now()}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Export to Word (HTML format)
export const exportToWord = (data: RevenueData, period: string, periodLabel: string) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Báo cáo Doanh thu - ${periodLabel}</title>
  <style>
    body { font-family: 'Times New Roman', serif; margin: 40px; }
    h1 { text-align: center; color: #d4a373; font-size: 24px; margin-bottom: 10px; }
    .header-info { text-align: center; margin-bottom: 30px; font-size: 12px; color: #666; }
    .summary-box { background: #f9f9f9; padding: 20px; border: 1px solid #ddd; margin-bottom: 30px; }
    .summary-item { display: inline-block; width: 48%; margin-bottom: 10px; }
    .summary-label { font-weight: bold; color: #333; }
    .summary-value { color: #d4a373; font-size: 18px; font-weight: bold; }
    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
    th { background-color: #d4a373; color: white; padding: 12px; text-align: left; font-size: 14px; }
    td { padding: 10px; border-bottom: 1px solid #ddd; font-size: 13px; }
    tr:hover { background-color: #f5f5f5; }
    .total-row { font-weight: bold; background-color: #fff3e0; }
    .footer { margin-top: 40px; text-align: right; font-size: 12px; }
  </style>
</head>
<body>
  <h1>BÁO CÁO DOANH THU - ${periodLabel.toUpperCase()}</h1>
  <div class="header-info">
    <p>Ngày xuất báo cáo: ${new Date().toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
    <p>Thời gian: ${new Date().toLocaleTimeString('vi-VN')}</p>
  </div>

  <div class="summary-box">
    <div class="summary-item">
      <div class="summary-label">Tổng doanh thu:</div>
      <div class="summary-value">${formatCurrency(data.totalRevenue)}</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Tổng số đơn hàng:</div>
      <div class="summary-value">${data.totalOrders} đơn</div>
    </div>
    <div class="summary-item">
      <div class="summary-label">Doanh thu trung bình/đơn:</div>
      <div class="summary-value">${formatCurrency(data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0)}</div>
    </div>
  </div>

  <h3>Chi tiết theo ngày:</h3>
  <table>
    <thead>
      <tr>
        <th>STT</th>
        <th>Ngày</th>
        <th>Doanh thu</th>
        <th>Số đơn hàng</th>
        <th>Doanh thu TB/Đơn</th>
      </tr>
    </thead>
    <tbody>
      ${data.dailyData.map((item, index) => `
        <tr>
          <td>${index + 1}</td>
          <td>${new Date(item.date).toLocaleDateString('vi-VN')}</td>
          <td>${formatCurrency(item.revenue)}</td>
          <td>${item.orderCount}</td>
          <td>${formatCurrency(item.orderCount > 0 ? item.revenue / item.orderCount : 0)}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2">Tổng cộng</td>
        <td>${formatCurrency(data.totalRevenue)}</td>
        <td>${data.totalOrders}</td>
        <td>${formatCurrency(data.totalOrders > 0 ? data.totalRevenue / data.totalOrders : 0)}</td>
      </tr>
    </tbody>
  </table>

  <div class="footer">
    <p>___________________________</p>
    <p>Người lập báo cáo</p>
  </div>
</body>
</html>
  `;

  const blob = new Blob(['\ufeff' + htmlContent], { type: 'application/msword' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', `bao-cao-doanh-thu-${period}-${Date.now()}.doc`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Print functionality
export const printReport = (data: RevenueData, periodLabel: string) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(value);
  };

  const printContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Báo cáo Doanh thu - ${periodLabel}</title>
  <style>
    @media print {
      body { margin: 0; }
      .no-print { display: none; }
    }
    body { font-family: 'Times New Roman', serif; margin: 20px; }
    h1 { text-align: center; color: #d4a373; margin-bottom: 10px; }
    .header-info { text-align: center; margin-bottom: 20px; font-size: 12px; }
    .summary-box { background: #f9f9f9; padding: 15px; border: 1px solid #ddd; margin-bottom: 20px; }
    .summary-item { display: inline-block; width: 48%; margin-bottom: 10px; }
    table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    th { background-color: #d4a373; color: white; padding: 10px; text-align: left; }
    td { padding: 8px; border-bottom: 1px solid #ddd; }
    .total-row { font-weight: bold; background-color: #fff3e0; }
  </style>
</head>
<body>
  <h1>BÁO CÁO DOANH THU - ${periodLabel.toUpperCase()}</h1>
  <div class="header-info">
    <p>Ngày: ${new Date().toLocaleDateString('vi-VN')}</p>
  </div>
  <div class="summary-box">
    <div class="summary-item"><strong>Tổng doanh thu:</strong> ${formatCurrency(data.totalRevenue)}</div>
    <div class="summary-item"><strong>Tổng đơn hàng:</strong> ${data.totalOrders}</div>
  </div>
  <table>
    <thead>
      <tr><th>STT</th><th>Ngày</th><th>Doanh thu</th><th>Số đơn</th></tr>
    </thead>
    <tbody>
      ${data.dailyData.map((item, i) => `
        <tr>
          <td>${i + 1}</td>
          <td>${new Date(item.date).toLocaleDateString('vi-VN')}</td>
          <td>${formatCurrency(item.revenue)}</td>
          <td>${item.orderCount}</td>
        </tr>
      `).join('')}
      <tr class="total-row">
        <td colspan="2">Tổng</td>
        <td>${formatCurrency(data.totalRevenue)}</td>
        <td>${data.totalOrders}</td>
      </tr>
    </tbody>
  </table>
</body>
</html>
  `;

  const printWindow = window.open('', '_blank');
  if (printWindow) {
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  }
};