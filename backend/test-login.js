const axios = require('axios');

async function testLogin() {
  try {
    const res = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@portaldesa.id',
      password: 'Admin@2026'
    });
    console.log('LOGIN BERHASIL:', res.data);
  } catch (err) {
    console.error('LOGIN GAGAL:', err.response ? err.response.data : err.message);
  }
}

testLogin();
