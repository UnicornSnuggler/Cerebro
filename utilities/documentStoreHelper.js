const { DocumentStore } = require('ravendb');

exports.CreateDocumentStore = function(database) {
    var options = {
        certificate: Buffer.from(process.env.ravenPem, 'base64'),
        type: 'pem'
    }
    
    return new DocumentStore([process.env.ravenUri], database, options);
}