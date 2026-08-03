/**
 * dashboard.js
 * Mengambil semua data dari API backend dan mengisi Dashboard.
 * Terhubung langsung ke database MySQL melalui REST API.
 */

const Dashboard = {
  pieChart: null,

  async init() {
    try {
      await Promise.all([
        this.loadStats(),
        this.loadRecentReports(),
        this.loadHotspots(),
      ]);
    } catch (err) {
      console.error('Dashboard.init error:', err);
    }
  },

  /* ============================================================
     STATS — dari GET /api/dashboard/stats
     ============================================================ */
  async loadStats() {
    try {
      const res = await API.get('/dashboard/stats');
      if (!res.success) return;

      const d = res.data;

      // Isi kartu statistik
      this.setEl('statTotal',    d.total     ?? 0);
      this.setEl('statMenunggu', d.menunggu  ?? 0);
      this.setEl('statProses',   d.diproses  ?? 0);
      this.setEl('statSelesai',  d.selesai   ?? 0);
      this.setEl('statBulanIni', d.bulan_ini ?? 0);

      // Banner bawah
      this.setEl('bannerSelesai', d.selesai  ?? 0);
      this.setEl('bannerTotal',   d.total    ?? 0);

      // Quick Action badge (tampilkan jumlah menunggu jika ada)
      const qaMenunggu = document.getElementById('qaMenunggu');
      if (qaMenunggu && d.menunggu > 0) {
        const span = qaMenunggu.querySelector('span');
        if (span) span.textContent = `Laporan Menunggu (${d.menunggu})`;
      }

      // Gambar Pie Chart
      this.renderPieChart({
        selesai:     d.selesai     ?? 0,
        diproses:    d.diproses    ?? 0,
        diverifikasi:d.diverifikasi?? 0,
        menunggu:    d.menunggu    ?? 0,
        ditolak:     d.ditolak     ?? 0,
      });

    } catch (err) {
      console.error('loadStats error:', err);
    }
  },

  /* ============================================================
     RECENT REPORTS — dari GET /api/dashboard/recent
     ============================================================ */
  async loadRecentReports() {
    const tbody = document.getElementById('recentReportsBody');
    if (!tbody) return;

    try {
      const res = await API.get('/dashboard/recent');
      if (!res.success || res.data.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3" style="font-size:0.8rem;">Belum ada laporan</td></tr>`;
        return;
      }

      tbody.innerHTML = res.data.map(item => {
        const date = new Date(item.created_at);
        const dateStr = date.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
        const timeStr = date.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit' });

        return `
          <tr>
            <td style="font-family:monospace; font-size:0.75rem; color:#64748b;">${item.report_number}</td>
            <td><span class="badge-status badge-${item.status}">${this.statusLabel(item.status)}</span></td>
            <td style="max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;" title="${item.address}">${item.address}</td>
            <td>
              <div style="font-size:0.75rem; color:#334155;">${dateStr}</div>
              <div style="font-size:0.68rem; color:#94a3b8;">${timeStr}</div>
            </td>
            <td>
              <a href="report-detail.html?id=${item.id}" class="btn btn-sm btn-outline-secondary" title="Lihat Detail">
                <i class="fa-regular fa-eye"></i>
              </a>
            </td>
          </tr>
        `;
      }).join('');

    } catch (err) {
      console.error('loadRecentReports error:', err);
      tbody.innerHTML = `<tr><td colspan="5" class="text-center text-danger py-3" style="font-size:0.8rem;">Gagal memuat data</td></tr>`;
    }
  },

  /* ============================================================
     HOTSPOTS — dari GET /api/dashboard/hotspots
     ============================================================ */
  async loadHotspots() {
    const el = document.getElementById('hotspotList');
    if (!el) return;

    try {
      const res = await API.get('/dashboard/hotspots');
      if (!res.success || res.data.length === 0) {
        el.innerHTML = `<p class="text-muted text-center" style="font-size:0.78rem;">Belum ada data hotspot</p>`;
        return;
      }

      const rankClasses = ['rank-1', 'rank-2', 'rank-3'];
      el.innerHTML = res.data.map((item, i) => `
        <div class="hotspot-item">
          <div class="hotspot-rank ${rankClasses[i] || ''}">${i + 1}</div>
          <div class="hotspot-address">${item.address}</div>
          <div class="hotspot-count">${item.total} Laporan</div>
        </div>
      `).join('');

    } catch (err) {
      console.error('loadHotspots error:', err);
      el.innerHTML = `<p class="text-danger text-center" style="font-size:0.78rem;">Gagal memuat hotspot</p>`;
    }
  },

  /* ============================================================
     PIE CHART — Chart.js, satu chart saja
     ============================================================ */
  renderPieChart(data) {
    const canvas = document.getElementById('statusPieChart');
    if (!canvas) return;

    const labels = ['Selesai', 'Diproses', 'Diverifikasi', 'Menunggu', 'Ditolak'];
    const values = [data.selesai, data.diproses, data.diverifikasi, data.menunggu, data.ditolak];
    const colors = ['#10b981', '#3b82f6', '#8b5cf6', '#eab308', '#ef4444'];

    if (this.pieChart) this.pieChart.destroy();

    this.pieChart = new Chart(canvas, {
      type: 'doughnut',
      data: {
        labels,
        datasets: [{
          data: values,
          backgroundColor: colors,
          borderWidth: 2,
          borderColor: '#ffffff',
          hoverOffset: 6,
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '65%',
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (ctx) => ` ${ctx.label}: ${ctx.raw} laporan`
            }
          }
        }
      }
    });

    // Custom Legend
    const legendEl = document.getElementById('chartLegend');
    if (legendEl) {
      legendEl.innerHTML = labels.map((label, i) => `
        <div class="d-flex align-items-center gap-2 mb-1">
          <div style="width:10px; height:10px; border-radius:3px; background:${colors[i]}; flex-shrink:0;"></div>
          <span style="font-size:0.72rem; color:#64748b; flex:1;">${label}</span>
          <span style="font-size:0.72rem; font-weight:600; color:#334155;">${values[i]}</span>
        </div>
      `).join('');
    }
  },

  /* ============================================================
     HELPERS
     ============================================================ */
  setEl(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
  },

  statusLabel(status) {
    const map = {
      menunggu:     'Menunggu',
      diverifikasi: 'Diverifikasi',
      diproses:     'Diproses',
      selesai:      'Selesai',
      ditolak:      'Ditolak',
    };
    return map[status] || status;
  }
};
