import { useEffect, useMemo, useState } from 'react';
import ReactFlow, { Background, Controls, MarkerType } from 'reactflow';
import 'reactflow/dist/style.css';
import { Cloud, Info, Monitor, Router } from 'lucide-react';
import { EmptyState, PageError, PageHeader, PageLoading, StatusBadge } from './ConsolePrimitives.jsx';
import { getTopology } from '../services/api.js';

const nodeStatusColor = {
  online: '#16a34a',
  degraded: '#d97706',
  offline: '#dc2626',
};

export function TopologyPage({ onLogout, token }) {
  const [topology, setTopology] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const [status, setStatus] = useState('loading');
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    setStatus('loading');

    getTopology(token)
      .then((result) => {
        if (isMounted) {
          setTopology(result.data);
          setSelectedNode(null);
          setError('');
          setStatus('ready');
        }
      })
      .catch((requestError) => {
        if (isMounted) {
          setError(requestError.message);
          setStatus('error');
        }
      });

    return () => {
      isMounted = false;
    };
  }, [token]);

  const flow = useMemo(() => buildFlow(topology), [topology]);
  const hasDevices = (topology?.nodes ?? []).some((node) => node.type === 'device');

  return (
    <>
      <PageHeader
        badge="Phase 9"
        description="Visual topology of registered CloudNet devices, router, and cloud path."
        onLogout={onLogout}
        title="Network Topology"
      />

      <div className="py-6">
        {status === 'loading' && <PageLoading message="Loading topology" />}
        {status === 'error' && <PageError message={error} title="Topology is unavailable" />}
        {status === 'ready' && (
          <>
            <section className="mb-5 rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm font-semibold leading-6 text-cloudnet-blue">
              <span className="inline-flex items-start gap-2">
                <Info aria-hidden="true" className="mt-0.5 shrink-0" size={18} />
                {topology?.note ||
                  'Topology shows registered/known monitored devices. It does not claim automatic physical network discovery.'}
              </span>
            </section>

            {!hasDevices ? (
              <EmptyState message="No registered devices are available for topology visualization yet." />
            ) : (
              <div className="grid gap-5 xl:grid-cols-[1fr_320px]">
                <section className="h-[620px] overflow-hidden rounded-lg border border-cloudnet-line bg-white shadow-sm">
                  <ReactFlow
                    edges={flow.edges}
                    fitView
                    nodes={flow.nodes}
                    nodesDraggable={false}
                    onNodeClick={(_event, node) => setSelectedNode(node.data.raw)}
                    proOptions={{ hideAttribution: true }}
                  >
                    <Background color="#d8e2ec" gap={20} />
                    <Controls />
                  </ReactFlow>
                </section>

                <aside className="rounded-lg border border-cloudnet-line bg-white p-5 shadow-sm">
                  <h3 className="text-base font-bold">Node Details</h3>
                  {selectedNode ? (
                    <NodeDetails node={selectedNode} />
                  ) : (
                    <p className="mt-4 text-sm leading-6 text-slate-500">Select a topology node to inspect it.</p>
                  )}
                </aside>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
}

function buildFlow(topology) {
  const rawNodes = topology?.nodes ?? [];
  const deviceNodes = rawNodes.filter((node) => node.type === 'device');
  const centerX = 360;
  const baseY = 330;
  const spacing = 190;
  const startX = centerX - ((deviceNodes.length - 1) * spacing) / 2;

  const nodes = rawNodes.map((node, index) => {
    const position =
      node.type === 'cloud'
        ? { x: centerX, y: 20 }
        : node.type === 'router'
          ? { x: centerX, y: 170 }
          : { x: startX + deviceNodes.findIndex((device) => device.id === node.id) * spacing, y: baseY + (index % 2) * 90 };

    return {
      id: node.id,
      position,
      data: {
        label: <NodeLabel node={node} />,
        raw: node,
      },
      style: {
        border: `2px solid ${nodeStatusColor[node.status] ?? '#2563eb'}`,
        borderRadius: 8,
        color: '#102033',
        fontWeight: 700,
        minWidth: 150,
        padding: 0,
      },
    };
  });

  const edges = (topology?.edges ?? []).map((edge) => ({
    ...edge,
    animated: true,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: '#64748b',
    },
    style: {
      stroke: '#64748b',
      strokeWidth: 2,
    },
  }));

  return { nodes, edges };
}

function NodeLabel({ node }) {
  const Icon = node.type === 'cloud' ? Cloud : node.type === 'router' ? Router : Monitor;

  return (
    <div className="flex items-center gap-2 px-3 py-2">
      <Icon aria-hidden="true" className="text-cloudnet-blue" size={18} />
      <div className="min-w-0 text-left">
        <p className="truncate text-sm">{node.label}</p>
        {node.ipAddress && <p className="truncate text-xs font-medium text-slate-500">{node.ipAddress}</p>}
      </div>
    </div>
  );
}

function NodeDetails({ node }) {
  return (
    <div className="mt-4 space-y-4">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Label</p>
        <p className="mt-1 font-bold">{node.label}</p>
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Type</p>
        <p className="mt-1 font-bold">{node.type}</p>
      </div>
      {node.status && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-500">Status</p>
          <StatusBadge status={node.status} />
        </div>
      )}
      {node.hostname && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Hostname</p>
          <p className="mt-1 font-bold">{node.hostname}</p>
        </div>
      )}
      {node.ipAddress && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">IP Address</p>
          <p className="mt-1 font-bold">{node.ipAddress}</p>
        </div>
      )}
      {node.source && (
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Source</p>
          <p className="mt-1 font-bold">{node.source}</p>
        </div>
      )}
    </div>
  );
}
