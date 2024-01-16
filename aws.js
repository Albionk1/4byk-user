const dotenv = require('dotenv');

dotenv.config({ path: './.env' });
const S3 = require('aws-sdk/clients/s3');
const fs = require('fs');

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_KEY

const handleErrors = (err) => {
    let errors={}
if(err.message==='Image not found'){
    return errors.image='Image not found'
}
}
const s3 = new S3({
    region,
    accessKeyId,
    secretAccessKey
});
// uploads a file to S3

function uploadFile(file) {
    const fileStream = fs.createReadStream(file.path);
    const uploadParameters = {
        Bucket: bucketName,
        Body: fileStream,
        Key: file.filename
    }
    return s3.upload(uploadParameters).promise();

    // Rreshti 26 ngarkon skedarin(foton) nga serveri dhe si pergjigjje kthen formatin e meposhtem:
    // {
    //     ETag: '"5af74663de67084821043df000790e5a"',
    //     VersionId: '0vn4QMsOy1bt64837XewJ4U7ujRKtXfQ',
    //     Location: 'https://e-prona.s3.eu-central-1.amazonaws.com/imgtest-1662475968393.jpg',
    //     key: 'imgtest-1662475968393.jpg',
    //     Key: 'imgtest-1662475968393.jpg',
    //     Bucket: 'e-prona'
    // }
    // Duhet te merre  "Key"(rr-34) te ruhet ne db
}

// download a file from S3

function getFileStream(fileKey, respo) {
    const dowloadParams = {
        Key: fileKey,
        Bucket: bucketName
    }
    try {
         s3.getObject(dowloadParams).createReadStream().on('error', (e) => { 
            console.log(e)
                respo.end()
        })
          .pipe(respo)
          .on('data', (data) => { 
          });
    } catch (error) {
        console.log(error)
        const errors = handleErrors(error)
    }
}

function deleteImage(fileKey) {
    s3.deleteObject({
        Bucket: bucketName,
        Key: fileKey
    }, function(err, data) {
        if (err) {
            console.log(err);
        }
        if (data) {
            console.log(data);
        }
    })
}

// Rreshti 48 merr skedarin(foton) nga AWS Storage 3 (AWS S3) dhe si pergjigjje kthen formatin STREAM

module.exports = {
    uploadFile,
    getFileStream,
    deleteImage
}