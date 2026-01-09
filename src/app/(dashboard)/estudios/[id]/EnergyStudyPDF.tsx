'use client';

import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import { EnergyStudy, Lead, ENERGY_PROVIDERS, EnergyProvider } from '@/lib/types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: 'Helvetica',
    fontSize: 11,
    color: '#1f2937',
  },
  header: {
    marginBottom: 30,
    borderBottom: '2px solid #2563eb',
    paddingBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#2563eb',
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
  },
  section: {
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#1f2937',
    backgroundColor: '#f3f4f6',
    padding: 8,
    borderRadius: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottom: '1px solid #e5e7eb',
  },
  label: {
    color: '#6b7280',
  },
  value: {
    fontWeight: 'bold',
    color: '#1f2937',
  },
  savingsBox: {
    backgroundColor: '#ecfdf5',
    borderRadius: 8,
    padding: 20,
    marginBottom: 25,
    borderLeft: '4px solid #10b981',
  },
  savingsTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#047857',
    marginBottom: 15,
  },
  savingsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  savingsItem: {
    alignItems: 'center',
  },
  savingsAmount: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#059669',
  },
  savingsLabel: {
    fontSize: 10,
    color: '#047857',
    marginTop: 4,
  },
  comparisonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 25,
  },
  comparisonBox: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
  },
  beforeBox: {
    backgroundColor: '#fef2f2',
    borderLeft: '4px solid #ef4444',
  },
  afterBox: {
    backgroundColor: '#f0fdf4',
    borderLeft: '4px solid #22c55e',
  },
  boxTitle: {
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  beforeTitle: {
    color: '#dc2626',
  },
  afterTitle: {
    color: '#16a34a',
  },
  boxRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  boxLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  boxValue: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  beforeValue: {
    color: '#dc2626',
  },
  afterValue: {
    color: '#16a34a',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    textAlign: 'center',
    color: '#9ca3af',
    fontSize: 9,
    borderTop: '1px solid #e5e7eb',
    paddingTop: 10,
  },
  clientInfo: {
    backgroundColor: '#eff6ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 25,
  },
  clientName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e40af',
    marginBottom: 5,
  },
  clientDetail: {
    fontSize: 10,
    color: '#3b82f6',
  },
  servicesContainer: {
    marginTop: 10,
  },
  serviceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  serviceBullet: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#22c55e',
    marginRight: 8,
  },
  conditionsBox: {
    backgroundColor: '#fefce8',
    padding: 15,
    borderRadius: 8,
    marginTop: 15,
    borderLeft: '4px solid #eab308',
  },
  conditionsTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#a16207',
    marginBottom: 8,
  },
  conditionsText: {
    fontSize: 10,
    color: '#713f12',
    lineHeight: 1.4,
  },
});

interface EnergyStudyPDFProps {
  study: EnergyStudy;
  lead: Lead;
}

export function EnergyStudyPDF({ study, lead }: EnergyStudyPDFProps) {
  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Estudio Energetico</Text>
          <Text style={styles.subtitle}>Calidad Energia - Propuesta de ahorro personalizada</Text>
        </View>

        {/* Client Info */}
        <View style={styles.clientInfo}>
          <Text style={styles.clientName}>{lead.full_name}</Text>
          <Text style={styles.clientDetail}>Telefono: {lead.phone}</Text>
          {lead.email && <Text style={styles.clientDetail}>Email: {lead.email}</Text>}
          <Text style={styles.clientDetail}>Fecha: {format(new Date(study.created_at), "d 'de' MMMM 'de' yyyy", { locale: es })}</Text>
        </View>

        {/* Savings Summary */}
        <View style={styles.savingsBox}>
          <Text style={styles.savingsTitle}>RESUMEN DE AHORRO</Text>
          <View style={styles.savingsGrid}>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsAmount}>{study.monthly_savings?.toFixed(2)} EUR</Text>
              <Text style={styles.savingsLabel}>Ahorro Mensual</Text>
            </View>
            <View style={styles.savingsItem}>
              <Text style={styles.savingsAmount}>{study.annual_savings?.toFixed(2)} EUR</Text>
              <Text style={styles.savingsLabel}>Ahorro Anual</Text>
            </View>
          </View>
        </View>

        {/* Before/After Comparison */}
        <View style={styles.comparisonContainer}>
          {/* BEFORE */}
          {study.has_invoice && study.current_provider && (
            <View style={[styles.comparisonBox, styles.beforeBox]}>
              <Text style={[styles.boxTitle, styles.beforeTitle]}>
                ANTES - {ENERGY_PROVIDERS[study.current_provider as EnergyProvider]}
              </Text>
              <View style={styles.boxRow}>
                <Text style={styles.boxLabel}>Coste mensual</Text>
                <Text style={[styles.boxValue, styles.beforeValue]}>{study.current_monthly_cost?.toFixed(2)} EUR</Text>
              </View>
              {study.current_power_p1 && (
                <View style={styles.boxRow}>
                  <Text style={styles.boxLabel}>Potencia P1</Text>
                  <Text style={styles.boxValue}>{study.current_power_p1} kW</Text>
                </View>
              )}
              {study.current_power_p2 && (
                <View style={styles.boxRow}>
                  <Text style={styles.boxLabel}>Potencia P2</Text>
                  <Text style={styles.boxValue}>{study.current_power_p2} kW</Text>
                </View>
              )}
              {study.current_consumption_annual && (
                <View style={styles.boxRow}>
                  <Text style={styles.boxLabel}>Consumo anual</Text>
                  <Text style={styles.boxValue}>{study.current_consumption_annual} kWh</Text>
                </View>
              )}
            </View>
          )}

          {/* AFTER */}
          <View style={[styles.comparisonBox, styles.afterBox]}>
            <Text style={[styles.boxTitle, styles.afterTitle]}>
              DESPUES - {ENERGY_PROVIDERS[study.new_provider as EnergyProvider]}
            </Text>
            <View style={styles.boxRow}>
              <Text style={styles.boxLabel}>Coste mensual</Text>
              <Text style={[styles.boxValue, styles.afterValue]}>{study.new_monthly_cost?.toFixed(2)} EUR</Text>
            </View>
            {study.new_power_p1 && (
              <View style={styles.boxRow}>
                <Text style={styles.boxLabel}>Potencia P1</Text>
                <Text style={styles.boxValue}>{study.new_power_p1} kW</Text>
              </View>
            )}
            {study.new_power_p2 && (
              <View style={styles.boxRow}>
                <Text style={styles.boxLabel}>Potencia P2</Text>
                <Text style={styles.boxValue}>{study.new_power_p2} kW</Text>
              </View>
            )}
          </View>
        </View>

        {/* Contract Details */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>DETALLES DEL CONTRATO</Text>
          <View style={styles.row}>
            <Text style={styles.label}>Duracion del contrato</Text>
            <Text style={styles.value}>{study.contract_duration_months} meses</Text>
          </View>
          <View style={styles.row}>
            <Text style={styles.label}>Nueva companía</Text>
            <Text style={styles.value}>{ENERGY_PROVIDERS[study.new_provider as EnergyProvider]}</Text>
          </View>
        </View>

        {/* Additional Services */}
        {(study.has_maintenance_insurance || study.has_pac_iberdrola || study.other_services) && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>SERVICIOS ADICIONALES</Text>
            <View style={styles.servicesContainer}>
              {study.has_maintenance_insurance && (
                <View style={styles.serviceItem}>
                  <View style={styles.serviceBullet} />
                  <Text>Seguro de mantenimiento {study.maintenance_insurance_cost ? `(${study.maintenance_insurance_cost.toFixed(2)} EUR/mes)` : ''}</Text>
                </View>
              )}
              {study.has_pac_iberdrola && (
                <View style={styles.serviceItem}>
                  <View style={styles.serviceBullet} />
                  <Text>PAC Iberdrola {study.pac_cost ? `(${study.pac_cost.toFixed(2)} EUR/mes)` : ''}</Text>
                </View>
              )}
              {study.other_services && (
                <View style={styles.serviceItem}>
                  <View style={styles.serviceBullet} />
                  <Text>{study.other_services} {study.other_services_cost ? `(${study.other_services_cost.toFixed(2)} EUR/mes)` : ''}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Special Conditions */}
        {study.special_conditions && (
          <View style={styles.conditionsBox}>
            <Text style={styles.conditionsTitle}>CONDICIONES ESPECIALES</Text>
            <Text style={styles.conditionsText}>{study.special_conditions}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text>Documento generado por Calidad Energia - {format(new Date(), "d/MM/yyyy HH:mm")}</Text>
          <Text>Este documento es una propuesta y no constituye un contrato vinculante.</Text>
        </View>
      </Page>
    </Document>
  );
}
