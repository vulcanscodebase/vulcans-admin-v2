"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, ChevronRight, ChevronDown } from "lucide-react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";

interface PodNode {
  _id: string;
  name: string;
  type: string;
  email: string;
  children?: PodNode[];
  parent?: PodNode;
}

interface PodHierarchyTreeProps {
  hierarchy: any;
  currentPodId: string;
}

export default function PodHierarchyTree({ hierarchy, currentPodId }: PodHierarchyTreeProps) {
  const router = useRouter();
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set([currentPodId]));

  // Expand parent and children when hierarchy loads
  useEffect(() => {
    if (hierarchy) {
      const expanded = new Set<string>([currentPodId]);
      if (hierarchy.parent?._id) {
        expanded.add(hierarchy.parent._id);
      }
      if (hierarchy.children && Array.isArray(hierarchy.children)) {
        hierarchy.children.forEach((child: any) => {
          const childId = typeof child === "object" ? child._id : child;
          if (childId) expanded.add(childId);
        });
      }
      setExpandedNodes(expanded);
    }
  }, [hierarchy, currentPodId]);

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const renderNode = (node: PodNode, level: number = 0, isLast: boolean = false) => {
    const isExpanded = expandedNodes.has(node._id);
    const hasChildren = node.children && node.children.length > 0;
    const isCurrentPod = node._id === currentPodId;

    return (
      <div key={node._id} className="relative">
        {/* Connection Lines */}
        {level > 0 && (
          <div
            className="absolute left-0 top-0 bottom-0 w-px bg-border"
            style={{
              left: `${(level - 1) * 24 + 12}px`,
              height: isLast ? "50%" : "100%",
            }}
          />
        )}

        <div className="flex items-start gap-2 py-2" style={{ paddingLeft: `${level * 24}px` }}>
          {/* Expand/Collapse Button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(node._id)}
              className="mt-1 p-0.5 hover:bg-muted rounded transition-colors"
            >
              {isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
            </button>
          ) : (
            <div className="w-5" />
          )}

          {/* Pod Card */}
          <div
            className={`flex-1 cursor-pointer transition-all hover:scale-[1.02] ${
              isCurrentPod ? "ring-2 ring-vulcan-accent-blue rounded-lg" : ""
            }`}
            onClick={() => router.push(`/dashboard/pods/${node._id}`)}
          >
            <Card
              className={`${
                isCurrentPod
                  ? "bg-vulcan-accent-blue/10 border-vulcan-accent-blue"
                  : "hover:border-vulcan-accent-blue/50"
              } transition-colors`}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div
                      className={`p-2 rounded-lg ${
                        isCurrentPod
                          ? "bg-vulcan-accent-blue text-white"
                          : "bg-muted text-foreground"
                      }`}
                    >
                      <Building2 className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <h3
                          className={`font-semibold text-lg ${
                            isCurrentPod ? "text-vulcan-accent-blue" : "text-foreground"
                          }`}
                        >
                          {node.name}
                        </h3>
                        {isCurrentPod && (
                          <span className="text-xs px-2 py-0.5 bg-vulcan-accent-blue text-white rounded-full">
                            Current
                          </span>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span className="capitalize">{node.type}</span>
                        <span>•</span>
                        <span className="truncate">{node.email}</span>
                        {hasChildren && (
                          <>
                            <span>•</span>
                            <span className="text-vulcan-accent-blue">
                              {node.children?.length} child{node.children?.length !== 1 ? "ren" : ""}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="relative">
            {node.children?.map((child, index) => (
              <div key={child._id}>
                {renderNode(child, level + 1, index === (node.children?.length || 0) - 1)}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  if (!hierarchy) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pod Hierarchy</CardTitle>
          <CardDescription>Parent-child relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hierarchy data available. This pod has no parent or children.
          </p>
        </CardContent>
      </Card>
    );
  }

  // Build tree structure from hierarchy data
  // API returns: { pod: {...}, parent: {...}, children: [...] }
  const buildTree = (data: any): PodNode | null => {
    if (!data) return null;

    // Handle API response structure: { pod, parent, children }
    if (data.pod && (data.parent || data.children)) {
      const currentPod: PodNode = {
        _id: data.pod._id,
        name: data.pod.name,
        type: data.pod.type,
        email: data.pod.associatedEmail || data.pod.email || "N/A",
        children: [],
      };

      // Add children if they exist
      if (data.children && Array.isArray(data.children) && data.children.length > 0) {
        currentPod.children = data.children
          .filter((child: any) => child !== null && child !== undefined)
          .map((child: any) => {
            // Handle both populated objects and ObjectIds
            if (typeof child === "object" && child._id) {
              return {
                _id: child._id,
                name: child.name || "Unknown",
                type: child.type || "N/A",
                email: child.associatedEmail || child.email || child.path || "N/A",
                children: [], // Children would need to be fetched separately
              };
            }
            // If it's just an ID string, we can't show details - skip for now
            return null;
          })
          .filter((child: any) => child !== null);
      }

      // If there's a parent, we need to show it above the current pod
      if (data.parent && typeof data.parent === "object" && data.parent._id) {
        const parentNode: PodNode = {
          _id: data.parent._id,
          name: data.parent.name || "Unknown",
          type: data.parent.type || "N/A",
          email: data.parent.associatedEmail || data.parent.email || "N/A",
          children: [currentPod],
        };
        return parentNode;
      }

      return currentPod;
    }

    // If it's already a tree structure with root
    if (data.root) {
      return data.root;
    }

    // If it's a single pod object
    if (data._id) {
      const node: PodNode = {
        _id: data._id,
        name: data.name,
        type: data.type,
        email: data.associatedEmail || data.email || "N/A",
        children: data.children || [],
      };
      return node;
    }

    // If it's an array, build tree
    if (Array.isArray(data)) {
      if (data.length === 0) return null;
      
      // Find root (no parentPodId)
      const root = data.find((p: any) => !p.parentPodId);
      if (!root) {
        // If no root, use first item
        const first = data[0];
        return {
          _id: first._id,
          name: first.name,
          type: first.type,
          email: first.associatedEmail || first.email || "N/A",
          children: [],
        };
      }

      // Build children recursively
      const buildChildren = (parentId: string): PodNode[] => {
        return data
          .filter((p: any) => {
            const pid = typeof p.parentPodId === "object" ? p.parentPodId._id : p.parentPodId;
            return pid === parentId;
          })
          .map((p: any) => ({
            _id: p._id,
            name: p.name,
            type: p.type,
            email: p.associatedEmail || p.email || "N/A",
            children: buildChildren(p._id),
          }));
      };

      return {
        _id: root._id,
        name: root.name,
        type: root.type,
        email: root.associatedEmail || root.email || "N/A",
        children: buildChildren(root._id),
      };
    }

    return null;
  };

  const rootNode = buildTree(hierarchy);

  if (!rootNode) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pod Hierarchy</CardTitle>
          <CardDescription>Parent-child relationships</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8">
            No hierarchy data available.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pod Hierarchy</CardTitle>
        <CardDescription>
          Visual representation of parent-child pod relationships. Click on any pod to view details.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 py-4">{renderNode(rootNode, 0, true)}</div>
      </CardContent>
    </Card>
  );
}

