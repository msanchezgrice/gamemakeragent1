import Fastify from 'fastify';
import { OrchestratorService } from './orchestrator.js';

const fastify = Fastify({ logger: true });
const orchestrator = new OrchestratorService();

fastify.post('/runs', async (request, reply) => {
  const run = orchestrator.createRun({
    brief: (request.body as any).brief
  });
  return reply.code(201).send(run);
});

fastify.get('/runs', async () => {
  return orchestrator.listRuns();
});

fastify.get('/runs/:id', async (request, reply) => {
  const run = orchestrator.getRun((request.params as any).id);
  if (!run) return reply.code(404).send({ error: 'Not found' });
  return run;
});

fastify.post('/runs/:id/advance', async (request, reply) => {
  const { id } = request.params as any;
  try {
    const result = await orchestrator.advance(id);
    return result;
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: (error as Error).message });
  }
});

fastify.post('/runs/:id/tasks/:taskId/resolve', async (request, reply) => {
  const { id, taskId } = request.params as any;
  try {
    const run = orchestrator.resolveTask(id, taskId);
    return run;
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: (error as Error).message });
  }
});

fastify.listen({ port: 3333, host: '0.0.0.0' }).then(() => {
  fastify.log.info('Orchestrator dev server running on http://localhost:3333');
});
