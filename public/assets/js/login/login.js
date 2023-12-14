const loginForm = document.querySelector('#kt_sign_in_form')
const success_alert = document.getElementById('response_message')
if (loginForm) {
  loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    if (loginForm) {
      const username = loginForm.username.value
      const password = loginForm.password.value

      try {
        const res = await fetch('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify({ username, password }),
          headers: { 'Content-Type': 'application/json' },
        })
        const data = await res.json()
        console.log(data)
        if (data.errors) {
          if (data.errors.error) {
            success_alert.className = 'alert alert-danger text-center'
            success_alert.innerHTML = data.errors.error
          }
          if (data.errors.id) {
            success_alert.className = 'alert alert-danger text-center'
            success_alert.innerHTML = data.errors.id
          }
        }
        if (!data.errors) {
          success_alert.className = ''
          success_alert.innerHTML = ''

          //TODO duhet me i ndreq routes specific ne baz te rolev
          if(data.data.user.role === 'Service'){
            location.assign('/admin/index');
          }
        }
      } catch (err) {
        console.log(err)
      }
    }
  })
}
