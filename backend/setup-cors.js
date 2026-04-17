const azure = require('azure-storage');

// بيانات اعتماد Azurite المحلي
const devStoreCreds = azure.generateDevelopmentStorageCredentials();
const blobService = azure.createBlobService(devStoreCreds);

// إعدادات CORS - مسموحة بالكامل للتطوير
const serviceProperties = {
    Cors: {
        CorsRule: [{
            AllowedOrigins: ['*'],           // السماح لجميع المواقع (للتطوير)
            AllowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'HEAD', 'OPTIONS'], // كل الطرق
            AllowedHeaders: ['*'],            // السماح بكل الهيدرات
            ExposedHeaders: ['*'],            // عرض كل الهيدرات
            MaxAgeInSeconds: 86400            // 24 ساعة
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
