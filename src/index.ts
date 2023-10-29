import forge from 'node-forge';
import { pki } from 'node-forge';
// generate a key pair
var keys = forge.pki.rsa.generateKeyPair(2048);

// create a certification request (CSR)
var csr = forge.pki.createCertificationRequest();
csr.publicKey = keys.publicKey;
csr.setSubject([{
    name: 'commonName',
    value: 'den.vom'
}, {
    name: 'countryName',
    value: 'US'
}, {
    shortName: 'ST',
    value: 'Virginia'
}, {
    name: 'localityName',
    value: 'Blacksburg'
}, {
    name: 'organizationName',
    value: 'Test'
}, {
    shortName: 'OU',
    value: 'Test'
}]);
// set (optional) attributes
csr.setAttributes([{
    name: 'challengePassword',
    value: 'password'
}, {
    name: 'unstructuredName',
    value: 'My Company, Inc.'
}, {
    name: 'extensionRequest',
    extensions: [{
        name: 'subjectAltName',
        altNames: [{
            // 2 is DNS type
            type: 2,
            value: 'test.domain.com'
        }, {
            type: 2,
            value: 'other.domain.com',
        }, {
            type: 2,
            value: 'www.domain.net'
        }]
    }]
}]);


function signCSR(csr: forge.pki.CertificateRequest, caPrivateKey: forge.pki.rsa.PrivateKey, caCertificate: forge.pki.Certificate) {
    const certificate = forge.pki.createCertificate();

    // Remplissez les détails du certificat, par exemple :
    certificate.publicKey = csr.publicKey;
    certificate.serialNumber = '01'; // Numéro de série unique
    certificate.validity.notBefore = new Date();
    certificate.validity.notAfter = new Date();
    certificate.setSubject(csr.subject.attributes);
    certificate.setIssuer(caCertificate.subject.attributes);

    // Signez le certificat avec la clé privée de l'autorité de certification
    certificate.sign(caPrivateKey, forge.md.sha256.create());

    return certificate;
}

const caPrivateKey = pki.privateKeyFromPem(await Bun.file("key.pem").text())
const caCertificate = pki.certificateFromPem(await Bun.file("cert.pem").text())
const res = signCSR(csr, caPrivateKey, caCertificate);

console.log(res);

await Bun.write("res.pem", pki.certificateToPem(res));