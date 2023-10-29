

const content = await Bun.file("db.json").json();
console.log(content["8f247e7a321da542ed0d61331d2518f9ab59d918d4467855c6ba7b4e"].pem)