const { CourierClient } = require('@trycourier/courier')

const courier = new CourierClient({
  authorizationToken: process.env.COURIER_AUTH_TOKEN,
})

const sendForgotPasswordEmail = (email, full_name, token) => {
  courier.send({
    message: {
      to: {
        email,
      },
      template: 'AZK2G5F7G34TAYQPZYAC3ANQZWPH',
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
