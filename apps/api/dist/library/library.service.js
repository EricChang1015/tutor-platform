"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.LibraryService = void 0;
const common_1 = require("@nestjs/common");
let LibraryService = class LibraryService {
    async getLibrary(query = {}) {
        const { include = 'all', depth = 2 } = query;
        const mockLibrary = {
            folders: [
                {
                    id: 'folder-001',
                    name: 'English Materials',
                    parentId: null,
                    path: '/English Materials',
                    children: [
                        {
                            id: 'folder-002',
                            name: 'Beginner',
                            parentId: 'folder-001',
                            path: '/English Materials/Beginner',
                            materials: [
                                {
                                    id: 'material-001',
                                    type: 'page',
                                    title: 'Basic Greetings',
                                    content: 'Hello, how are you? Nice to meet you!'
                                }
                            ]
                        },
                        {
                            id: 'folder-003',
                            name: 'Intermediate',
                            parentId: 'folder-001',
                            path: '/English Materials/Intermediate',
                            materials: [
                                {
                                    id: 'material-002',
                                    type: 'page',
                                    title: 'Daily Conversation',
                                    content: 'What did you do yesterday? I went to the park.'
                                }
                            ]
                        }
                    ]
                }
            ]
        };
        if (include === 'flat') {
            const flatMaterials = [];
            const extractMaterials = (folder) => {
                if (folder.materials) {
                    flatMaterials.push(...folder.materials);
                }
                if (folder.children) {
                    folder.children.forEach(extractMaterials);
                }
            };
            mockLibrary.folders.forEach(extractMaterials);
            return { materials: flatMaterials };
        }
        return mockLibrary;
    }
    async getMaterial(id) {
        const mockMaterials = {
            'material-001': {
                id: 'material-001',
                type: 'page',
                title: 'Basic Greetings',
                folderId: 'folder-002',
                content: 'Hello, how are you? Nice to meet you! My name is... What\'s your name?',
                meta: {
                    difficulty: 'beginner',
                    duration: 30,
                    tags: ['greetings', 'introduction']
                },
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
            },
            'material-002': {
                id: 'material-002',
                type: 'page',
                title: 'Daily Conversation',
                folderId: 'folder-003',
                content: 'What did you do yesterday? I went to the park. Did you have fun? Yes, it was great!',
                meta: {
                    difficulty: 'intermediate',
                    duration: 45,
                    tags: ['conversation', 'past tense']
                },
                createdAt: '2024-01-01T00:00:00Z',
                updatedAt: '2024-01-01T00:00:00Z'
            }
        };
        const material = mockMaterials[id];
        if (!material) {
            throw new Error('Material not found');
        }
        return material;
    }
};
exports.LibraryService = LibraryService;
exports.LibraryService = LibraryService = __decorate([
    (0, common_1.Injectable)()
], LibraryService);
//# sourceMappingURL=library.service.js.map