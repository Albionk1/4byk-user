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
      template: '8DWE25SRMX424EMTK4F5EB9Q8J4E',
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

const sendActivateEmail = (email, full_name, userId) => {
  courier.send({
    message: {
      to: {
        email,
      },
      template: '8NZZXESZSCMM66P5EWV3BJ5H0SAN',
      data: {
        full_name,
        userId,
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
  sendActivateEmail
}
