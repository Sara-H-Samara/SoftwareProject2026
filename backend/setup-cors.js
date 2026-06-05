const azure = require('azure-storage');

const devStoreCreds = azure.generateDevelopmentStorageCredentials();
const blobService = azure.createBlobService(devStoreCreds);

const serviceProperties = {
    Cors: {
        CorsRule: [{
            AllowedOrigins: ['*'],          
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'], 
            AllowedHeaders: ['*'],         
            ExposedHeaders: ['*'],           
            MaxAgeInSeconds: 86400           
        }]
    }
};

console.log('جاري تطبيق إعدادات CORS على Azurite...');

blobService.setServiceProperties(serviceProperties, function(error, result, response) {
    if (error) {
        console.error('❌ فشل تطبيق CORS:', error);
    } else {
        console.log('✅ تم تطبيق CORS بنجاح على Azurite');
        console.log('📋 الإعدادات:');
        console.log('   - AllowedOrigins: *');
        console.log('   - AllowedMethods: GET, POST, PUT, DELETE, HEAD, OPTIONS');
        console.log('   - AllowedHeaders: *');
        console.log('   - ExposedHeaders: *');
        console.log('   - MaxAgeInSeconds: 86400');
    }
});
