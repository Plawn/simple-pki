import { pki } from 'node-forge';
import { Elysia, t, } from 'elysia'
import { make_cert_from_params } from './make_keys';


type ID = string;

type PubCert = {
    id: string;
    /**
     * PEM encoded
     */
    pubKey: string;
    pem: string;
    children: ID[];
}

export type Certificate = PubCert & {
    /**
     * PEM encoded
     */
    privKey: string;
}

type Schema = {
    [key: string]: Certificate
}

class DB<Schema> {
    _content: Schema | undefined;
    filename: string;
    opened = false;
    defaultValue: () => Promise<Schema>;
    constructor(filename: string, defaultValue: () => Promise<Schema>) {
        this.filename = filename;
        this.defaultValue = defaultValue;
    }
    async open() {
        const file = Bun.file(this.filename)
        this._content = await file.exists() ? await file.json() : await this.defaultValue();
        this.opened = true;
    }

    async content() {
        if (!this.opened) {
            throw new Error("Not opened");
        }
        return this._content as Schema;
    }

    async persist() {
        if (!this.opened) {
            throw new Error("Not opened");
        }
        await Bun.write(this.filename, JSON.stringify(this._content));
    }

    async write(content: Schema) {
        if (!this.opened) {
            throw new Error("Not opened");
        }
        this._content = content;
    }

    async updateItem(c: Certificate) {
        // @ts-ignore
        this._content[c.id] = c;
    }

    async addItem(c: Certificate) {
        // @ts-ignore
        this._content[c.id] = c;
    }
}


const db = new DB<Schema>("db.json", async () => ({}));

const certParams = t.Object({
    attr: t.Object({
        commonName: t.String(),
        countryName: t.String(),
        organizationName: t.String(),
        organizationalUnitName: t.String(),
    })
});

const app = new Elysia()
    .post("/new/:id", async ({ params, body }) => {
        // TODO: handle find nested
        const c = (await db.content())[params.id];
        if (!c) {
            throw new Error("can't find parent");
        }
        const now = new Date();
        const end = new Date();

        end.setFullYear(end.getFullYear() + 1);
        const { certificate, keys } = make_cert_from_params({
            validity: {
                notBefore: now,
                notAfter: end,
            },
            attrs: [
                {
                    "name": "commonName",
                    value: body.attr.commonName
                },
                {
                    "name": "countryName",
                    value: body.attr.countryName
                },
                {
                    "name": "organizationName",
                    value: body.attr.organizationName
                },
                {
                    name: "organizationalUnitName",
                    value: body.attr.organizationalUnitName
                },

            ]
        }, c);
        // make cert
        // add it to parent
        // write db
        const cer: Certificate = {
            pem: pki.certificateToPem(certificate),
            id: certificate.serialNumber,
            privKey: pki.privateKeyToPem(keys.privateKey),
            pubKey: pki.publicKeyToPem(keys.publicKey),
            children: [],
        }
        c.children.push(cer.id);
        await db.updateItem(c);
        await db.addItem(cer);
        await db.persist();
    }, {
        body: certParams,
        params: t.Object({
            id: t.String()
        })
    })
    .post("/new/:id/csr", async () => {

    })
    .post("/new/root", async ({ body }) => {
        const now = new Date();
        const end = new Date();

        end.setFullYear(end.getFullYear() + 1);
        // one year automatic for now
        const { certificate, keys } = make_cert_from_params({
            validity: {
                notBefore: now,
                notAfter: end,
            },
            attrs: [
                {
                    "name": "commonName",
                    value: body.attr.commonName
                },
                {
                    "name": "countryName",
                    value: body.attr.countryName
                },
                {
                    "name": "organizationName",
                    value: body.attr.organizationName
                },
                {
                    name: "organizationalUnitName",
                    value: body.attr.organizationalUnitName
                },

            ]
        });

        const c: Certificate = {
            pem: pki.certificateToPem(certificate),
            id: certificate.serialNumber,
            privKey: pki.privateKeyToPem(keys.privateKey),
            pubKey: pki.publicKeyToPem(keys.publicKey),
            children: [],
        }
        const content = await db.content();
        await db.addItem(c);
        await db.persist();
    }, {
        body: certParams,
    })
    .get('/list', async () => {
        const base = await db.content()
        if (!base) {
            return {};
        }
        const res: { [id: string]: PubCert } = {}
        Object.entries(base).forEach(([k, v]) => {
            res[k] = getPub(v);
        })
        return res;
    });

function getPub(c: Certificate | PubCert): PubCert {
    return {
        id: c.id,
        pubKey: c.pubKey,
        pem: c.pem,
        children: c.children
    }
}



await db.open();

app.listen(3000);
export type App = typeof app;