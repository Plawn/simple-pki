import forge, { pki } from 'node-forge';
import { Certificate } from './server';




export function make_keys(size: 2048 | 4096) {
    const keys = forge.pki.rsa.generateKeyPair(size);
    const { privateKey, publicKey } = keys;
    return { privateKey, publicKey };
}

function make_cert_example({ privateKey, publicKey }: {
    privateKey: forge.pki.rsa.PrivateKey;
    publicKey: forge.pki.rsa.PublicKey;
}) {
    const cert = forge.pki.createCertificate();
    cert.publicKey = publicKey;
    // alternatively set public key from a csr
    //cert.publicKey = csr.publicKey;
    // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
    // Conforming CAs should ensure serialNumber is:
    // - no more than 20 octets
    // - non-negative (prefix a '00' if your value starts with a '1' bit)
    cert.serialNumber = '01';
    cert.validity.notBefore = new Date();
    cert.validity.notAfter = new Date();
    cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 1);
    const attrs = [{
        name: 'commonName',
        value: 'example.org'
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
    }];
    cert.setSubject(attrs);
    // alternatively set subject from a csr
    //cert.setSubject(csr.subject.attributes);
    cert.setIssuer(attrs);
    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 6, // URI
            value: 'http://example.org/webid#me'
        }, {
            type: 7, // IP
            ip: '127.0.0.1'
        }]
    }, {
        name: 'subjectKeyIdentifier'
    }]);
    /* alternatively set extensions from a csr
    var extensions = csr.getAttribute({name: 'extensionRequest'}).extensions;
    // optionally add more extensions
    extensions.push.apply(extensions, [{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }]);
    cert.setExtensions(extensions);
    */
    // self-sign certificate
    cert.sign(privateKey);
    return cert;
}

export type CertParams = {
    validity: {
        notBefore: Date;
        notAfter: Date;
    };
    attrs: forge.pki.CertificateField[]
}

function getSerialNumber() {
    return new Bun.SHA224().update(crypto.randomUUID()).digest("hex");
}

export function make_cert_from_params(params: CertParams, signer?: Certificate) {
    const keys = make_keys(2048);
    const cert = forge.pki.createCertificate();
    cert.publicKey = keys.publicKey;

    // NOTE: serialNumber is the hex encoded value of an ASN.1 INTEGER.
    // Conforming CAs should ensure serialNumber is:
    // - no more than 20 octets
    // - non-negative (prefix a '00' if your value starts with a '1' bit)
    
    cert.serialNumber = getSerialNumber();
    cert.validity = params.validity;

    cert.setSubject(params.attrs);
    if (signer) {
        const c = pki.certificateFromPem(signer.pem);
        cert.setIssuer(c.subject.attributes);
    } else {
        cert.setIssuer(params.attrs);
    }
    
    
    // console.log(params.attrs);

    cert.setExtensions([{
        name: 'basicConstraints',
        cA: true
    }, {
        name: 'keyUsage',
        keyCertSign: true,
        digitalSignature: true,
        nonRepudiation: true,
        keyEncipherment: true,
        dataEncipherment: true
    }, {
        name: 'extKeyUsage',
        serverAuth: true,
        clientAuth: true,
        codeSigning: true,
        emailProtection: true,
        timeStamping: true
    }, {
        name: 'nsCertType',
        client: true,
        server: true,
        email: true,
        objsign: true,
        sslCA: true,
        emailCA: true,
        objCA: true
    }, {
        name: 'subjectAltName',
        altNames: [{
            type: 6, // URI
            value: 'http://example.org/webid#me'
        }, {
            type: 7, // IP
            ip: '127.0.0.1'
        }]
    }, {
        name: 'subjectKeyIdentifier'
    }]);
    
    /* alternatively set extensions from a csr
    var extensions = csr.getAttribute({name: 'extensionRequest'}).extensions;
    // optionally add more extensions
    extensions.push.apply(extensions, [{
      name: 'basicConstraints',
      cA: true
    }, {
      name: 'keyUsage',
      keyCertSign: true,
      digitalSignature: true,
      nonRepudiation: true,
      keyEncipherment: true,
      dataEncipherment: true
    }]);
    cert.setExtensions(extensions);
    */
    // self-sign certificate
    if (signer) {
        cert.sign(pki.privateKeyFromPem(signer.privKey));
    } else {
        cert.sign(keys.privateKey);
    }
    return {
        certificate: cert, 
        keys,
    };
}



async function make_cert_test() {
    const keys = make_keys(2048);
    await Bun.write('key.pem', forge.pki.privateKeyToPem(keys.privateKey));
    const cert = make_cert_example(keys);
    await Bun.write('cert.pem', forge.pki.certificateToPem(cert));
}
