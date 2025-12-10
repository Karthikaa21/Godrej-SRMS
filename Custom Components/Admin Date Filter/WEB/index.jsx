import { kf } from '../sdk/index.js'
import React, { useState, useEffect } from 'react'

export function DefaultLandingComponent() {
  const getFirstDayOfCurrentMonth = () => {
    const today = new Date()
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1)
    return firstDay.toISOString().split('T')[0]
  }

  const getLastDayOfCurrentMonth = () => {
    const today = new Date()
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0)
    return lastDay.toISOString().split('T')[0]
  }

  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const isValidDate = (dateStr) =>
    dateStr && !Number.isNaN(Date.parse(dateStr))

  // Small helper to wait until account is ready
  const waitForAccount = async () => {
    let attempts = 0
    while (!kf.account?._id && attempts < 40) {
      await new Promise((r) => setTimeout(r, 250))
      attempts += 1
    }
    return kf.account?._id || null
  }

  // ----- TOP 5 MATERIALS & CUSTOMERS (driven by date range) -----
  const updateTopMaterialsAndCustomers = async (start, end) => {
    try {
      // Ensure account is ready
      const accId = await waitForAccount()
      if (!accId) {
        console.warn('[TopData] Missing account id even after waiting')
        // kf.client.showInfo('Account not ready, cannot load top materials/customers.')
        return
      }

      // PSO email -> variable
      if (kf.user?.Email) {
        await kf.app.setVariable('PSO_email_ID', kf.user.Email)
      }

      // ---------- Top 5 Materials ----------
      const fetchTopMaterials = async () => {
        try {
          const pivotResult = await kf.api(
            `/analytics/2/${accId}/ds_Top_Material_Child_Table_Popula_A00/report/Child_table_top_material_Admin_A00?apply_preference=1&$end_date=${end}&$start_date=${start}`,
            { method: 'GET' }
          )

          const dataRows = Array.isArray(pivotResult?.Data)
            ? pivotResult.Data
            : []

          const clearTopMaterialVars = async () => {
            for (let i = 1; i <= 5; i++) {
              await kf.app.setVariable(`Top_${i}_Material_Name`, '')
            }
          }

          if (!dataRows.length) {
            await clearTopMaterialVars()
            // kf.client.showInfo('No material data available for selected date range.')
            return
          }

          const sample = dataRows[0]
          const rowKey = Object.keys(sample).find((k) =>
            k.startsWith('Row_')
          )
          const colKey = Object.keys(sample).find((k) =>
            k.startsWith('Column_')
          )
          const valueKey = Object.keys(sample).find((k) =>
            k.startsWith('Value_')
          )

          if (!rowKey || !colKey || !valueKey) {
            await clearTopMaterialVars()
            console.log(
              '[Top Materials] Could not detect row/column/value keys. Sample row:',
              sample
            )
            // kf.client.showInfo('Could not detect keys for Top Materials.')
            return
          }

          const matches = []

          for (const r of dataRows) {
            const rowVal = r[rowKey]
            const colVal = r[colKey]
            if (rowVal == null || colVal == null) continue

            if (String(rowVal) === String(colVal)) {
              const numVal = Number(r[valueKey]) || 0
              matches.push({
                material: String(rowVal),
                value: numVal
              })
            }
          }

          if (!matches.length) {
            await clearTopMaterialVars()
            // kf.client.showInfo('No matching row/column materials found.')
            return
          }

          matches.sort((a, b) => b.value - a.value)
          const top = matches.slice(0, 5)

          for (let i = 1; i <= 5; i++) {
            const item = top[i - 1]
            const nameVar = `Top_${i}_Material_Name`
            if (item) {
              await kf.app.setVariable(nameVar, item.material)
            } else {
              await kf.app.setVariable(nameVar, '')
            }
          }

          // 🔍 Debug: show what actually got stored
          const debugLines = []
          for (let i = 1; i <= 5; i++) {
            const v = await kf.app.getVariable(`Top_${i}_Material_Name`)
            debugLines.push(`Top_${i}_Material_Name = ${v || ''}`)
          }
        //   kf.client.showInfo(
            // `Top Materials updated for ${start} to ${end}:\n` +
            //   debugLines.join('\n')
        //   )
        } catch (err) {
          console.error('[Top Materials] Error:', err)
        //   kf.client.showInfo('Error while fetching Top Materials.')
        }
      }

      // ---------- Top 5 Customers ----------
      const fetchTopCustomers = async () => {
        try {
          const pivotResult = await kf.api(
            `/process-report/2/${accId}/Sales_Return_Process_A00/CUSTOMER_TOP_PIVOT_A00?apply_preference=1&$end_date=${end}&$start_date=${start}`,
            { method: 'GET' }
          )

          const dataRows = Array.isArray(pivotResult?.Data)
            ? pivotResult.Data
            : []

          const clearTopCustomerVars = async () => {
            for (let i = 1; i <= 5; i++) {
              await kf.app.setVariable(`Top_${i}_Customer_Name`, '')
            }
          }

          if (!dataRows.length) {
            await clearTopCustomerVars()
            // kf.client.showInfo('No customer data available for selected date range.')
            return
          }

          const sample = dataRows[0]
          const rowKey = Object.keys(sample).find((k) =>
            k.startsWith('Row_')
          )
          const colKey = Object.keys(sample).find((k) =>
            k.startsWith('Column_')
          )
          const valueKey = Object.keys(sample).find((k) =>
            k.startsWith('Value_')
          )

          if (!rowKey || !colKey || !valueKey) {
            await clearTopCustomerVars()
            console.log(
              '[Top Customers] Could not detect row/column/value keys. Sample row:',
              sample
            )
            // kf.client.showInfo('Could not detect keys for Top Customers.')
            return
          }

          const matches = []

          for (const r of dataRows) {
            const rowVal = r[rowKey]
            const colVal = r[colKey]
            if (rowVal == null || colVal == null) continue

            if (String(rowVal) === String(colVal)) {
              const numVal = Number(r[valueKey]) || 0
              matches.push({
                customer: String(rowVal),
                value: numVal
              })
            }
          }

          if (!matches.length) {
            await clearTopCustomerVars()
            // kf.client.showInfo('No matching row/column customers found.')
            return
          }

          matches.sort((a, b) => b.value - a.value)
          const top = matches.slice(0, 5)

          for (let i = 1; i <= 5; i++) {
            const item = top[i - 1]
            const nameVar = `Top_${i}_Customer_Name`
            if (item) {
              await kf.app.setVariable(nameVar, item.customer)
            } else {
              await kf.app.setVariable(nameVar, '')
            }
          }

          // 🔍 Debug: show what actually got stored
          const debugLines = []
          for (let i = 1; i <= 5; i++) {
            const v = await kf.app.getVariable(`Top_${i}_Customer_Name`)
            debugLines.push(`Top_${i}_Customer_Name = ${v || ''}`)
          }
        //   kf.client.showInfo(
        //     `Top Customers updated for ${start} to ${end}:\n` +
        //       debugLines.join('\n')
        //   )
        } catch (err) {
          console.error('[Top Customers] Error:', err)
        //   kf.client.showInfo('Error while fetching Top Customers.')
        }
      }

      // Run both
      await fetchTopMaterials()
      await fetchTopCustomers()
    } catch (e) {
      console.error('[TopData] Failed to update top materials/customers:', e)
    //   kf.client.showInfo('Failed to update top materials/customers.')
    }
  }

  // ----- Load initial dates from KF (or default to current month) -----
  useEffect(() => {
    const loadDates = async () => {
      try {
        let storedStart = ''
        let storedEnd = ''

        if (kf.app?.page?.getVariable) {
          storedStart = await kf.app.page.getVariable('Start_date')
          storedEnd = await kf.app.page.getVariable('End_date')
        }

        const defaultStart = getFirstDayOfCurrentMonth()
        const defaultEnd = getLastDayOfCurrentMonth()

        const finalStart = isValidDate(storedStart)
          ? storedStart
          : defaultStart
        const finalEnd = isValidDate(storedEnd) ? storedEnd : defaultEnd

        setStartDate(finalStart)
        setEndDate(finalEnd)

        if (!isValidDate(storedStart)) {
          await kf.app.page.setVariable('Start_date', finalStart)
        }
        if (!isValidDate(storedEnd)) {
          await kf.app.page.setVariable('End_date', finalEnd)
        }
      } catch (error) {
        console.error('❌ Error loading or setting date variables:', error)
        // kf.client.showInfo('Error loading initial date values.')
      }
    }

    loadDates()
  }, [])

  // ----- Whenever start/end date changes → hit APIs & update top vars -----
  useEffect(() => {
    const run = async () => {
      if (isValidDate(startDate) && isValidDate(endDate)) {
        await updateTopMaterialsAndCustomers(startDate, endDate)
      }
    }
    run()
  }, [startDate, endDate])

  const handleDateChange = async (type, value) => {
    if (!value) return

    const formattedDate = new Date(value).toISOString().split('T')[0]

    if (type === 'start') {
      setStartDate(formattedDate)
      try {
        await kf.app.page.setVariable('Start_date', formattedDate)
      } catch (err) {
        console.error('Error setting Start_date:', err)
        // kf.client.showInfo('Error setting Start_date.')
      }
    } else if (type === 'end') {
      setEndDate(formattedDate)
      try {
        await kf.app.page.setVariable('End_date', formattedDate)
      } catch (err) {
        console.error('Error setting End_date:', err)
        // kf.client.showInfo('Error setting End_date.')
      }
    }
  }

  return (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: '16px',
            backgroundColor: '#f8f9fa',
            width: '100%',
            minWidth: '100vw',
            boxSizing: 'border-box'
        }}>
            <div style={{
                display: 'flex',
                gap: '12px',
                backgroundColor: 'transparent',
                padding: '10px 16px',
                borderRadius: '8px',
                alignItems: 'center',
                maxWidth: '1280px',
                width: '100%'
            }}>
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>Start Date</label>
                <input
                    type="date"
                    value={startDate}
                    onChange={(e) => handleDateChange('start', e.target.value)}
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        backgroundColor: 'white',
                        color: '#0d6efd',
                        fontWeight: '500',
                        outline: 'none',
                        appearance: 'none',
                        width: '140px'
                    }}
                />
                <label style={{ fontSize: '14px', fontWeight: '500', color: '#495057' }}>End Date</label>
                <input
                    type="date"
                    value={endDate}
                    onChange={(e) => handleDateChange('end', e.target.value)}
                    style={{
                        border: '1px solid #ccc',
                        borderRadius: '6px',
                        padding: '6px 10px',
                        backgroundColor: 'white',
                        color: '#0d6efd',
                        fontWeight: '500',
                        outline: 'none',
                        appearance: 'none',
                        width: '140px'
                    }}
                />
            </div>
        </div>
    )
}
