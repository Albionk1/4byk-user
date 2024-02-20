const mongoose = require('mongoose')
const multer = require('multer')
var crypto = require("crypto");
const path = require('path')
const os = require('os');


const storage = multer.diskStorage({
  filename: function (req, file, cb) {
    let noWhiteSpaceOriginalName = file.originalname
      .split('.')[0]
      .replace(/\s/g, '')
    cb(
      null,
      file.fieldname +
        '-' +
        noWhiteSpaceOriginalName +
        '-' +
        Date.now() +
        path.extname(file.originalname)
    )
  },
})

const fileSizeLimitErrorHandler = (err, req, res, next) => {
  if (err.code === 'LIMIT_FILE_SIZE') {
    res.status(413).send({ error: 'File is to large' })
  } else {
    next()
  }
}

const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === 'image/jpeg' ||
    file.mimetype === 'image/jpg' ||
    file.mimetype === 'image/png' ||
    file.mimetype === 'image/webp'
  ) {
    cb(null, true)
  } else {
    cb(null, false)
    req.multerInvalidFileTypeErr = 'INVALID_FILE_TYPE'
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5000000,
  },
})

const uploadSingleImage = upload.single('image')
const uploadSinglePdf = upload.single('pdf')


const uploadMultipleImages = upload.fields([
  { name: 'primaryImage', maxCount: 1 },
  { name: 'secondaryImages', maxCount: 2 },
])

const filterObj = (obj, ...allowedFields) => {
  const newObj = {}
  Object.keys(obj).forEach((el) => {
    if (allowedFields.includes(el)) newObj[el] = obj[el]
  })
  return newObj
}

const validMongoId = (id) => mongoose.isValidObjectId(id)

const validMongoIds = (objectIds) => {
  let areValid = true
  for(let id of objectIds){
    if(!validMongoId(id)){
      return areValid = false
    }
  }
  return areValid
}

const arraysEqual = (arr1, arr2) => {
  if (arr1.length !== arr2.length) {
    return false;
  }

  for (let i = 0; i < arr1.length; i++) {
    if (!arr2.includes(arr1[i])) {
      return false;
    }
  }

  return true;
}

class APIFeatures {
  constructor(query, queryString) {
    this.query = query
    this.queryString = queryString
  }

  filter() {
    const queryObj = { ...this.queryString }
    const excludedFields = ['page', 'sort', 'limit', 'fields']
    excludedFields.forEach((el) => delete queryObj[el])

    // 1B) Advanced filtering
    let queryStr = JSON.stringify(queryObj)
    queryStr = queryStr.replace(/\b(gte|gt|lte|lt)\b/g, (match) => `$${match}`)

    let queryO = JSON.parse(queryStr)

    // Filtering with features
    if (queryO.features) {
      let features = queryO.features.split(',')

      queryO.features = { $regex: '', $options: 'i' }

      for (let feature of features) {
        queryO.features.$regex += `(?=.*${feature})`
      }
    }

    // Filtrimi me search string me titull te pronës
    if (queryO.title) {
      // queryO.title = { $regex: `${queryO.title}`, $options: 'i' }

      //Full text search with agencyName and address
      let q = { $text: { $search: `${queryO.title}` } }
      q.score = { score: { $meta: 'textScore' } }

      this.query = this.query.find(q)

      return this
    }

    if (queryO.category) {
      if (!mongoose.isValidObjectId(queryO.category)) {
        throw new Error('INVALID_ID')
      }
    }

    this.query = this.query.find(queryO)

    return this
  }

  sort() {
    //Per me i ba order by text search
    if (this.queryString.agencyName || this.queryString.title) {
      this.query = this.query.sort({ score: { $meta: 'textScore' } })
    } else if (this.queryString.sort) {
      const sortBy = this.queryString.sort.split(',').join(' ')
      this.query = this.query.sort(sortBy)
    } else {
      this.query = this.query.sort('-createdAt')
    }

    return this
  }

  limitFields() {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ')
      this.query = this.query.select(fields)
    } else {
      this.query = this.query.select('-__v')
    }

    return this
  }

  paginate() {
    const page = this.queryString.page * 1 || 1
    const limit = this.queryString.limit * 1 || 12
    const skip = (page - 1) * limit

    this.query = this.query.skip(skip).limit(limit)

    return this
  }
}

const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next)
  }
}


const generateBillNumber = () => {
  var billNumber = crypto.randomBytes(4).toString('hex');
  return `NC-${billNumber.toUpperCase()}`
}

const separateWithComma = (num) => {
  return num.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",")
}

const users = []

const addUser = ({ id, userId,room,client }) => {
    const user ={ id, userId,room,client }
    users.push(user)
    return  user 
}

const editRoom = ({ userId,room }) => {
  var user=users.find((user) => user.userId === userId)
   user.room=room
  return  user 
}
const removeUser = (id) => {
    const index = users.findIndex((user) => user.id === id)
    if (index !== -1) {
         users.splice(index, 1)[0]
         
    }
}

const getUser = (id) => {
    return users.find((user) => user.userId === id)
}

module.exports = {
  catchAsync,
  filterObj,
  validMongoId,
  validMongoIds,
  arraysEqual,
  APIFeatures,
  uploadSingleImage,
  uploadSinglePdf,
  fileSizeLimitErrorHandler,
  uploadMultipleImages,
  generateBillNumber,
  separateWithComma,
  addUser,
  editRoom,
  removeUser,
  getUser
}

// Code on how to update the updates array of orderHistory

// const updateData = {
//   message: 'Porosia u pranua nga postieri',
//   order_status: 'in progress',
//   updatedBy: senderUser._id, // ID of the user who made the update
//   updatedAt: new Date()
// }

// const newOrderHistory = await OrderHistory.findOneAndUpdate(
//   { order: order._id }, // filter for the document you want to update
//   { $push: { updates: updateData }, order_status: 'accepted' }, // update the updates array and the order_status
//   { new: true, session: session } // return the updated document
// )

// Code on how to populate the user from the orderHistory updates array

// const orderHistory = await OrderHistory.findById(orderHistoryId)
//   .populate({
//     path: 'updates.updatedBy',
//     model: 'User',
//     select: 'name email'
//   })