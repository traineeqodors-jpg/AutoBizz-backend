const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const { ApiError } = require("./ApiError");


const s3Client = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  },
});



const uploadToS3 = async (localFilePath, filename, mimetype) => {
  try {
    const fileContent = await fs.readFile(localFilePath);
    
    const params = {
      Bucket: process.env.AWS_BUCKET_NAME,
      Key: `uploads/${filename}`, 
      Body: fileContent,
      ContentType: mimetype,
    };

   
    await s3Client.send(new PutObjectCommand(params));

  
    await fs.remove(localFilePath);
   
    return `https://${params.Bucket}.s3.${process.env.AWS_REGION}://{params.Key}`;
  } catch (error) {
    
    if (await fs.pathExists(localFilePath)) {
      await fs.remove(localFilePath);
    }
    throw new ApiError(500, `AWS S3 Upload Failed: ${error.message}`);
  }
};

module.exports = {uploadToS3}