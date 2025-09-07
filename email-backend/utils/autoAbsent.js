const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY // Use service key for backend operations
);

/**
 * Auto mark absent function
 * Marks employees as absent if they don't have attendance records for the target date
 * @param {string} targetDate - Optional date in YYYY-MM-DD format. If not provided, uses yesterday's date
 * @returns {Object} Result object with success status, message, count, and employee details
 */
const handleAutoMarkAbsent = async (targetDate = null) => {
  try {
    // Use provided date or yesterday if none provided
    const dateToProcess = targetDate || new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0]; // Yesterday's date in YYYY-MM-DD format
    
    console.log(`[AUTO-ABSENT] Processing auto-absent for date: ${dateToProcess}`);

    // Get all employees (excluding admins/hr/superadmins)
    const { data: allUsers, error: usersError } = await supabase
      .from('users')
      .select('id, name, employee_id, department')
      .in('employee_type', ['full-time', 'internship', 'temporary'])
      .not('role', 'in', '(superadmin,admin,hr)');

    if (usersError) {
      console.error('[AUTO-ABSENT] Error fetching users:', usersError);
      throw usersError;
    }

    console.log(`[AUTO-ABSENT] Found ${allUsers?.length || 0} total employees`);

    // Get existing attendance records for the date
    const { data: existingAttendance, error: attendanceError } = await supabase
      .from('attendance')
      .select('user_id')
      .eq('date', dateToProcess);

    if (attendanceError) {
      console.error('[AUTO-ABSENT] Error fetching attendance:', attendanceError);
      throw attendanceError;
    }

    console.log(`[AUTO-ABSENT] Found ${existingAttendance?.length || 0} existing attendance records`);

    // Find employees without attendance records
    const employeesWithRecords = existingAttendance?.map(record => record.user_id) || [];
    const employeesWithoutRecords = allUsers?.filter(user => 
      !employeesWithRecords.includes(user.id)
    ) || [];

    if (employeesWithoutRecords.length === 0) {
      console.log('[AUTO-ABSENT] All employees already have attendance records for', dateToProcess);
      return {
        success: true,
        message: 'All employees already have attendance records',
        count: 0,
        date: dateToProcess,
        totalEmployees: allUsers?.length || 0,
        employeesWithRecords: employeesWithRecords.length,
        employees: []
      };
    }

    console.log(`[AUTO-ABSENT] Found ${employeesWithoutRecords.length} employees without records`);
    console.log('[AUTO-ABSENT] Employees to mark absent:', employeesWithoutRecords.map(emp => emp.name));

    // Create absent records
    const absentRecords = employeesWithoutRecords.map(employee => ({
      user_id: employee.id,
      date: dateToProcess,
      check_in: null,
      check_out: null,
      total_hours: 0,
      is_present: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }));

    // Insert absent records
    const { error: insertError } = await supabase
      .from('attendance')
      .insert(absentRecords);

    if (insertError) {
      console.error('[AUTO-ABSENT] Error inserting absent records:', insertError);
      throw insertError;
    }
    
    console.log(`[AUTO-ABSENT] Successfully marked ${employeesWithoutRecords.length} employees as absent for ${dateToProcess}`);
    
    return {
      success: true,
      message: `Marked ${employeesWithoutRecords.length} employees as absent for ${dateToProcess}`,
      count: employeesWithoutRecords.length,
      date: dateToProcess,
      totalEmployees: allUsers?.length || 0,
      employeesWithRecords: employeesWithRecords.length,
      employees: employeesWithoutRecords.map(emp => ({
        id: emp.id,
        name: emp.name,
        employee_id: emp.employee_id,
        department: emp.department
      }))
    };
    
  } catch (error) {
    console.error('[AUTO-ABSENT] Error in handleAutoMarkAbsent:', error);
    throw {
      success: false,
      message: 'Failed to process auto-absent marking',
      error: error.message,
      stack: error.stack
    };
  }
};

/**
 * Get auto-absent statistics for a specific date
 * @param {string} date - Date in YYYY-MM-DD format. If not provided, uses yesterday
 * @returns {Object} Statistics about auto-absent records
 */
const getAutoAbsentStats = async (date = null) => {
  try {
    const targetDate = date || new Date(Date.now() - 24 * 60 * 60 * 1000)
      .toISOString().split('T')[0];

    // Get absent records for the date
    const { data: absentRecords, error } = await supabase
      .from('attendance')
      .select(`
        user_id,
        date,
        users!inner(
          id,
          name,
          employee_id,
          department,
          employee_type
        )
      `)
      .eq('date', targetDate)
      .eq('is_present', false)
      .is('check_in', null);

    if (error) {
      console.error('[AUTO-ABSENT] Error fetching auto-absent stats:', error);
      throw error;
    }

    return {
      success: true,
      date: targetDate,
      autoAbsentCount: absentRecords?.length || 0,
      employees: absentRecords?.map(record => ({
        id: record.users.id,
        name: record.users.name,
        employee_id: record.users.employee_id,
        department: record.users.department,
        employee_type: record.users.employee_type
      })) || []
    };

  } catch (error) {
    console.error('[AUTO-ABSENT] Error in getAutoAbsentStats:', error);
    throw {
      success: false,
      message: 'Failed to get auto-absent statistics',
      error: error.message
    };
  }
};



module.exports = {
  handleAutoMarkAbsent,
  getAutoAbsentStats
};