import Fastify from 'fastify';
import { OrchestratorService } from './orchestrator.js';
import { createRunStore } from './store.factory.js';
const fastify = Fastify({ logger: true });
// Add CORS support
fastify.register(import('@fastify/cors'), {
    origin: true,
    credentials: true
});
const store = createRunStore();
const orchestrator = new OrchestratorService({ store });
fastify.post('/runs', async (request, reply) => {
    const run = await orchestrator.createRun({
        brief: request.body.brief
    });
    return reply.code(201).send(run);
});
fastify.get('/runs', async () => orchestrator.listRuns());
fastify.get('/runs/:id', async (request, reply) => {
    const run = await orchestrator.getRun(request.params.id);
    if (!run)
        return reply.code(404).send({ error: 'Not found' });
    return run;
});
fastify.post('/runs/:id/advance', async (request, reply) => {
    const { id } = request.params;
    try {
        const result = await orchestrator.advance(id);
        return result;
    }
    catch (error) {
        request.log.error(error);
        return reply.code(400).send({ error: error.message });
    }
});
fastify.post('/runs/:id/tasks/:taskId/resolve', async (request, reply) => {
    const { id, taskId } = request.params;
    try {
        const run = await orchestrator.resolveTask(id, taskId);
        return run;
    }
    catch (error) {
        request.log.error(error);
        return reply.code(400).send({ error: error.message });
    }
});
// Health check endpoint
fastify.get('/health', async () => {
    return { status: 'healthy', timestamp: new Date().toISOString() };
});
fastify.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
    fastify.log.info('Orchestrator dev server running on http://localhost:3333');
});
//# sourceMappingURL=devServer.js.map