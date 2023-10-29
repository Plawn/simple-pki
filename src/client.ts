// client.ts
import { edenTreaty } from '@elysiajs/eden'
import type { App } from './server'

const app = edenTreaty<App>('http://localhost:3000')


const id = "fruit";

async function list() {
    const { data, error } = await app.list.get();

    console.log(data);
}

async function createRoot() {
    const { data, error } = await app.new.root.post({
        attr: {
            commonName: "Plawn",
            countryName: "FR",
            organizationName: "Plawn Labs",
            organizationalUnitName: "root",
        }
    });

    console.log(data);
}

async function createChild(id:string) {
    const { data, error } = await app.new[id].post({
        attr: {
            commonName: "Plawn",
            countryName: "FR",
            organizationName: "Plawn Labs",
            organizationalUnitName: "child",
        }
    });

    console.log(data);
}

// await createRoot();
await list();
await createChild(id);




// response type: 'Hi Elysia'
// const { data, error } = await app.

// console.log(data);

// console.log(data, error);

// response type: 1895
// const { data: id, error } = app.id['1895'].get()

// // response type: { id: 1895, name: 'Skadi' }
// const { data: nendoroid, error } = app.mirror.post({
//     id: 1895,
//     name: 'Skadi'
// })