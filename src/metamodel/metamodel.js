// metamodel.js
export const metamodel = {
    objecttypes: [
        { id: '058cbb1b-018e-4959-2a33-a27889543209', name: 'Information' },
        { id: 'bbb60f1c-b5a3-41dc-dff6-2b594f54a2dd', name: 'Role' },
        { id: '29d76eb4-29b7-4cf7-ed16-a1d172738bad', name: 'Task' },
        { id: '6e465c81-59f2-46f8-4c1d-ec5c2e30b358', name: 'View' },
        { id: '7e9386c9-75bc-4239-c040-d328f1c91e1b', name: 'Property' },
        // ...other object types
    ],
    relshiptypes: [
        { id: '5607bf3b-23d3-4141-f95b-06ff806f86f2', name: 'performs', namenameFrom: 'Role', namenameTo: 'Task' },
        { id: 'a56028f6-b0c2-43fb-8af4-02f3f80b2de0', name: 'hasInput', nameFrom: 'View', nameTo: 'Information' },
        { id: '1e0f61b2-e636-458c-3306-d281d66f7826', name: 'hasOutput', nameFrom: 'View', nameTo: 'Information' },
        { id: '2fb581fc-6c9c-47d6-e479-9502ffa6c3e5', name: 'fills', nameFrom: 'Person', nameTo: 'Role' },
        { id: '4f673acd-ca6c-4309-0235-d1d7767c826d', name: 'worksOn', nameFrom: 'Task', nameTo: 'Information' },
        // { id: '7b3c0877-0e98-4fc6-2715-5f31e4f30219', name: 'includes', nameFrom: 'Container', nameTo: 'any' },
        { id: '9bc101cd-4bdf-4965-a063-02112a2e8b2a', name: 'includes', nameFrom: 'Information', nameTo: 'Information' },
        { id: '668978e6-d9ba-4596-1329-6a63d24686e5', name: 'applies', nameFrom: 'Task', nameTo: 'View' },
        { id: '4ad51319-e154-4418-0dc6-575ad645e68e', name: 'refersTo', nameFrom: 'Task', nameTo: 'Information' },
        // ...other relationship types
    ],
};
