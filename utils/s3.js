const {
    S3Client,
    PutObjectCommand,
    DeleteObjectCommand,
    GetObjectCommand
} = require('@aws-sdk/client-s3')

const {
    getSignedUrl
} = require('@aws-sdk/s3-request-presigner')

require('dotenv').config()

const bucketName = process.env.AWS_BUCKET_NAME
const region = process.env.AWS_BUCKET_REGION
const accessKeyId = process.env.AWS_ACCESS_KEY
const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY

const s3 = new S3Client({
    region: region,
    credentials: {
        accessKeyId: accessKeyId,
        secretAccessKey: secretAccessKey
    }
})

const uploadObject = (fileBuffer, fileName, mimetype) => {
    const uploadParams = {
        Bucket: bucketName,
        Body: fileBuffer,
        Key: fileName,
        ContentType: mimetype
    }

    return s3.send(new PutObjectCommand(uploadParams))
}

const deleteObject = (fileName) => {
    const deleteParams = {
        Bucket: bucketName,
        Key: fileName
    }

    return s3.send(new DeleteObjectCommand(deleteParams))
}

const getObjectSignedUrl = async (fileName) => {
    const params = {
        Bucket: bucketName,
        Key: fileName
    }

    const command = new GetObjectCommand(params)
    const seconds = 130
    const url = await getSignedUrl(s3, command, { expiresIn: seconds })
    return url
}

module.exports = {
    uploadObject,
    deleteObject,
    getObjectSignedUrl
}