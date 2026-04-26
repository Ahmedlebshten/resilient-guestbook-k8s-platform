#!/bin/bash
set -e

echo "Installing Helm..."
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash

echo "Adding Helm repositories..."
helm repo add prometheus-community https://prometheus-community.github.io/helm-charts
helm repo add grafana https://grafana.github.io/helm-charts
helm repo update

echo "Creating monitoring namespace..."
kubectl create namespace monitoring || true

echo "Installing kube-prometheus-stack..."

helm upgrade --install kube-prometheus-stack prometheus-community/kube-prometheus-stack \
  --namespace monitoring \
  --set grafana.sidecar.dashboards.enabled=true \
  --set grafana.sidecar.datasources.enabled=true

echo "Installing loki-stack..."

helm upgrade --install loki grafana/loki-stack \
  --namespace monitoring \
  --set grafana.enabled=false \
  --set prometheus.enabled=false \
  --set promtail.enabled=true

echo "Patching Grafana Service to NodePort..."

kubectl patch svc kube-prometheus-stack-grafana -n monitoring -p '{"spec": {"type": "NodePort", "ports": [{"port": 80, "targetPort": 3000, "nodePort": 30002}]}}'

echo "Waiting for pods to be ready..."
kubectl wait --namespace monitoring --for=condition=ready pod -l app.kubernetes.io/name=grafana --timeout=300s || true

echo "Fetching Grafana admin password..."

GRAFANA_PASSWORD=$(kubectl get secret --namespace monitoring kube-prometheus-stack-grafana -o jsonpath="{.data.admin-password}" | base64 --decode)

EC2_IP=$(curl -s http://checkip.amazonaws.com)

echo "------------------------------------------------------"
echo "Monitoring Setup Complete!"
echo "Grafana Access Details:"
echo "URL: http://$EC2_IP:30002"
echo "Username: admin"
echo "Password: $GRAFANA_PASSWORD"
echo "------------------------------------------------------"