const { CourierClient } = require('@trycourier/courier')

const courier = CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN,
})

const sendForgotPasswordEmail = (email, full_name, token) => {
  courier.send({
    message: {
      to: {
        email,
      },
      template: 'ZBQ3VGDWWWMJB9MWZWM8QPDBYE6Q',
      data: {
        full_name,
        token,
      },
      routing: {
        method: 'single',
        channels: ['email'],
      },
    },
  })
}









module.exports = {
  sendForgotPasswordEmail,
}
