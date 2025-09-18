import Fastify from 'fastify';
import { OrchestratorService } from './orchestrator.js';
import type { IntakeBrief } from '@gametok/schemas';

const fastify = Fastify({ logger: true });
const orchestrator = new OrchestratorService();

type RunParams = { id: string };
type RunTaskParams = { id: string; taskId: string };
type CreateRunBody = { brief: IntakeBrief };

fastify.post<{ Body: CreateRunBody }>('/runs', async (request, reply) => {
  const run = orchestrator.createRun({
    brief: request.body.brief
  });
  return reply.code(201).send(run);
});

fastify.get('/runs', async () => orchestrator.listRuns());

fastify.get<{ Params: RunParams }>('/runs/:id', async (request, reply) => {
  const run = orchestrator.getRun(request.params.id);
  if (!run) return reply.code(404).send({ error: 'Not found' });
  return run;
});

fastify.post<{ Params: RunParams }>('/runs/:id/advance', async (request, reply) => {
  const { id } = request.params;
  try {
    const result = await orchestrator.advance(id);
    return result;
  } catch (error) {
    request.log.error(error);
    return reply.code(400).send({ error: (error as Error).message });
  }
});

fastify.post<{ Params: RunTaskParams }>('/runs/:id/tasks/:taskId/resolve', async (request, reply) => {
  const { id, taskId } = request.params;
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
