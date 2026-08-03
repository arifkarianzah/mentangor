// assets/js/report.js

document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('formLaporan');
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');
  const previewContainer = document.getElementById('previewContainer');
  const addressInput = document.getElementById('inputAddress');
  const duplicateWarning = document.getElementById('duplicateWarning');
  const btnSubmit = document.getElementById('btnSubmit');
  
  if (!form) return;

  let selectedFiles = []; // Store selected files

  // 1. Drag & Drop Upload Logic
  dropZone.addEventListener('click', () => fileInput.click());

  ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, preventDefaults, false);
  });

  function preventDefaults(e) {
    e.preventDefault();
    e.stopPropagation();
  }

  ['dragenter', 'dragover'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
  });

  dropZone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    const files = dt.files;
    handleFiles(files);
  });

  fileInput.addEventListener('change', function() {
    handleFiles(this.files);
  });

  function handleFiles(files) {
    const newFiles = Array.from(files).filter(file => {
      // Validasi tipe & ukuran (5MB)
      if (!['image/jpeg', 'image/png'].includes(file.type)) {
        Swal.fire('Error', `File ${file.name} bukan JPG/PNG`, 'error');
        return false;
      }
      if (file.size > 5 * 1024 * 1024) {
        Swal.fire('Error', `Ukuran file ${file.name} melebihi 5MB`, 'error');
        return false;
      }
      return true;
    });

    if (selectedFiles.length + newFiles.length > 5) {
      Swal.fire('Error', 'Maksimal 5 foto yang dapat diunggah', 'error');
      return;
    }

    selectedFiles = [...selectedFiles, ...newFiles];
    renderPreviews();
  }

  function renderPreviews() {
    previewContainer.innerHTML = '';
    selectedFiles.forEach((file, index) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onloadend = () => {
        const div = document.createElement('div');
        div.className = 'position-relative';
        div.innerHTML = `
          <img src="${reader.result}" class="rounded object-fit-cover border" style="width: 100px; height: 100px;">
          <button type="button" class="btn btn-danger btn-sm position-absolute top-0 end-0 rounded-circle m-1" style="width:24px;height:24px;padding:0;line-height:1;" onclick="removeFile(${index})"><i class="fa-solid fa-times"></i></button>
        `;
        previewContainer.appendChild(div);
      };
    });
  }

  window.removeFile = (index) => {
    selectedFiles.splice(index, 1);
    renderPreviews();
  };

  // 2. Duplicate Warning Logic (Debounce)
  let timeoutId;
  addressInput.addEventListener('input', (e) => {
    clearTimeout(timeoutId);
    const address = e.target.value.trim();
    
    if (address.length > 5) {
      timeoutId = setTimeout(() => {
        checkDuplicate(address);
      }, 1000);
    } else {
      duplicateWarning.classList.add('d-none');
      duplicateWarning.classList.remove('d-flex');
    }
  });

  async function checkDuplicate(address) {
    try {
      const res = await API.get(`/reports/check-duplicate?address=${encodeURIComponent(address)}`);
      if (res.success && res.data.has_similar) {
        duplicateWarning.classList.remove('d-none');
        duplicateWarning.classList.add('d-flex');
      } else {
        duplicateWarning.classList.add('d-none');
        duplicateWarning.classList.remove('d-flex');
      }
    } catch (e) {
      console.error(e);
    }
  }

  // 3. Form Submit
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (selectedFiles.length === 0) {
      Swal.fire('Peringatan', 'Harap unggah minimal 1 foto bukti (Before).', 'warning');
      return;
    }

    const formData = new FormData(form);
    
    // Hapus input gambar kosong (karena kita pakai array selectedFiles)
    formData.delete('images'); 
    
    // Append file dari selectedFiles
    selectedFiles.forEach(file => {
      formData.append('images', file);
    });

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span> Mengirim...';

    try {
      const res = await API.post('/reports', formData, true);
      
      if (res.success) {
        // Tampilkan modal sukses dengan nomor laporan
        document.getElementById('successReportNumber').textContent = res.data.report_number;
        const modal = new bootstrap.Modal(document.getElementById('successModal'));
        modal.show();
        
        form.reset();
        selectedFiles = [];
        renderPreviews();
        duplicateWarning.classList.add('d-none');
        duplicateWarning.classList.remove('d-flex');
      }
    } catch (err) {
      Swal.fire('Gagal', err.message || 'Terjadi kesalahan saat mengirim laporan', 'error');
    } finally {
      btnSubmit.disabled = false;
      btnSubmit.innerHTML = 'Kirim Laporan';
    }
  });

});
