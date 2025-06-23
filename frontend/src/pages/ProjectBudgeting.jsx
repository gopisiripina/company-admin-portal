
import React, { useState, useEffect } from 'react';
import { Plus, DollarSign, TrendingUp, TrendingDown, PiggyBank, Package, Filter, Calendar } from 'lucide-react';

const ProjectBudgeting = ({ userRole }) => {
  const [projects, setProjects] = useState([
    { id: 1, name: 'Website Redesign' },
    { id: 2, name: 'Mobile App Development' },
    { id: 3, name: 'Marketing Campaign' }
  ]);
  const [selectedProject, setSelectedProject] = useState('');
  const [showAddProjectModal, setShowAddProjectModal] = useState(false);
  const [showAddExpensesModal, setShowAddExpensesModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [expenseType, setExpenseType] = useState(''); // 'projects' or 'extraexpensive'
  const [newProjectName, setNewProjectName] = useState('');
  
  // Add expenses form data
  const [selectedExpenseProject, setSelectedExpenseProject] = useState('');
  const [expenseData, setExpenseData] = useState({
    income: '',
    expenses: '',
    savings: '',
    investment: ''
  });
  const [extraExpenseName, setExtraExpenseName] = useState('');
  const [extraExpenseAmount, setExtraExpenseAmount] = useState('');
  
  // Inventory filter
  const [inventoryFilter, setInventoryFilter] = useState('all');
  
  // Sample data for projects
  const [budgetData, setBudgetData] = useState({
    totalIncome: 50000,
    totalExpenses: 32000,
    totalSavings: 18000,
    totalInvestment: 25000
  });

  // Extra expenses data
  const [extraExpenses, setExtraExpenses] = useState([
    { id: 1, name: 'Office Supplies', amount: 1500, date: '2025-06-20', category: 'weekly' },
    { id: 2, name: 'Software Licenses', amount: 5000, date: '2025-06-15', category: 'monthly' },
    { id: 3, name: 'Marketing Materials', amount: 2500, date: '2025-06-18', category: 'weekly' },
    { id: 4, name: 'Equipment Purchase', amount: 8000, date: '2025-06-10', category: 'monthly' }
  ]);

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
    // Mock data generation for different projects
    setBudgetData({
      totalIncome: Math.floor(Math.random() * 100000) + 30000,
      totalExpenses: Math.floor(Math.random() * 50000) + 20000,
      totalSavings: Math.floor(Math.random() * 30000) + 10000,
      totalInvestment: Math.floor(Math.random() * 40000) + 15000
    });
  };

  const handleAddProject = () => {
    if (newProjectName.trim()) {
      const newProject = {
        id: projects.length + 1,
        name: newProjectName.trim()
      };
      setProjects([...projects, newProject]);
      setNewProjectName('');
      setShowAddProjectModal(false);
      console.log('Project added:', newProject);
    }
  };

  const handleAddExpenses = () => {
    setShowAddExpensesModal(true);
    setExpenseType('');
  };

  const handleExpenseTypeSelect = (type) => {
    setExpenseType(type);
  };

  const handleProjectExpenseUpdate = () => {
    if (selectedExpenseProject && Object.values(expenseData).some(val => val !== '')) {
      // Update budget data for selected project
      const updates = {};
      if (expenseData.income) updates.totalIncome = parseInt(expenseData.income);
      if (expenseData.expenses) updates.totalExpenses = parseInt(expenseData.expenses);
      if (expenseData.savings) updates.totalSavings = parseInt(expenseData.savings);
      if (expenseData.investment) updates.totalInvestment = parseInt(expenseData.investment);
      
      setBudgetData(prev => ({ ...prev, ...updates }));
      
      // Reset form
      setExpenseData({ income: '', expenses: '', savings: '', investment: '' });
      setSelectedExpenseProject('');
      setShowAddExpensesModal(false);
      setExpenseType('');
      
      console.log('Project expenses updated:', updates);
    }
  };

  const handleExtraExpenseAdd = () => {
    if (extraExpenseName.trim() && extraExpenseAmount) {
      const newExpense = {
        id: extraExpenses.length + 1,
        name: extraExpenseName.trim(),
        amount: parseInt(extraExpenseAmount),
        date: new Date().toISOString().split('T')[0],
        category: 'weekly' // Default category
      };
      
      setExtraExpenses([...extraExpenses, newExpense]);
      setExtraExpenseName('');
      setExtraExpenseAmount('');
      setShowAddExpensesModal(false);
      setExpenseType('');
      
      console.log('Extra expense added:', newExpense);
    }
  };

  const getFilteredExtraExpenses = () => {
    if (inventoryFilter === 'all') return extraExpenses;
    return extraExpenses.filter(expense => expense.category === inventoryFilter);
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const resetModals = () => {
    setShowAddExpensesModal(false);
    setShowInventoryModal(false);
    setExpenseType('');
    setExpenseData({ income: '', expenses: '', savings: '', investment: '' });
    setSelectedExpenseProject('');
    setExtraExpenseName('');
    setExtraExpenseAmount('');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header Section */}
      <div style={{ marginBottom: '32px' }}>
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: '700', color: '#1f2937', margin: '0 0 8px 0' }}>
            Project Budgeting
          </h1>
          <p style={{ color: '#6b7280', fontSize: '1rem', margin: '0' }}>
            Manage your project finances and track budget allocation
          </p>
        </div>
      </div>

      {/* Controls Section */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '32px',
        padding: '24px',
        background: 'white',
        borderRadius: '12px',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
      }}>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <label style={{ fontWeight: '600', color: '#374151', whiteSpace: 'nowrap' }}>
              Select Project:
            </label>
            <select
              value={selectedProject}
              onChange={(e) => handleProjectSelect(e.target.value)}
              style={{
                padding: '10px 16px',
                border: '2px solid #e5e7eb',
                borderRadius: '8px',
                fontSize: '14px',
                minWidth: '200px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              <option value="">Choose a project...</option>
              {projects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => setShowAddProjectModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: '#3b82f6',
              color: 'white'
            }}
          >
            <Plus size={20} />
            Add Project
          </button>
          <button
            onClick={handleAddExpenses}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: '#10b981',
              color: 'white'
            }}
          >
            <DollarSign size={20} />
            Add Expenses
          </button>
          <button
            onClick={() => setShowInventoryModal(true)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px 20px',
              borderRadius: '8px',
              fontWeight: '600',
              cursor: 'pointer',
              border: 'none',
              background: '#8b5cf6',
              color: 'white'
            }}
          >
            <Package size={20} />
            Inventory
          </button>
        </div>
      </div>

      {/* Budget Table */}
      {selectedProject && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden',
          marginBottom: '24px'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}>
            <h2 style={{ margin: '0', color: '#1f2937', fontSize: '1.5rem' }}>Budget Overview</h2>
            <span style={{ color: '#6b7280', fontWeight: '500' }}>
              Project: {projects.find(p => p.id == selectedProject)?.name}
            </span>
          </div>
          
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '24px',
            padding: '24px'
          }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dcfdf4 0%, #f0fdf4 100%)',
              border: '1px solid #10b981'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#10b981',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingUp size={24} />
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Income
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatCurrency(budgetData.totalIncome)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fef2f2 0%, #fefefe 100%)',
              border: '1px solid #ef4444'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#ef4444',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <TrendingDown size={24} />
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Expenses
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatCurrency(budgetData.totalExpenses)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #dbeafe 0%, #f0f9ff 100%)',
              border: '1px solid #3b82f6'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#3b82f6',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <PiggyBank size={24} />
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Savings
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatCurrency(budgetData.totalSavings)}
                </div>
              </div>
            </div>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '16px',
              padding: '20px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #fef3c7 0%, #fffbeb 100%)',
              border: '1px solid #f59e0b'
            }}>
              <div style={{
                padding: '12px',
                borderRadius: '10px',
                background: '#f59e0b',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}>
                <DollarSign size={24} />
              </div>
              <div>
                <h3 style={{
                  margin: '0 0 8px 0',
                  color: '#374151',
                  fontSize: '0.875rem',
                  fontWeight: '600',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Total Investment
                </h3>
                <div style={{ fontSize: '1.5rem', fontWeight: '700', color: '#1f2937' }}>
                  {formatCurrency(budgetData.totalInvestment)}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Extra Expenses Table */}
      {extraExpenses.length > 0 && (
        <div style={{
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)',
          overflow: 'hidden'
        }}>
          <div style={{
            padding: '24px',
            borderBottom: '1px solid #e5e7eb'
          }}>
            <h2 style={{ margin: '0', color: '#1f2937', fontSize: '1.5rem' }}>Extra Expenses</h2>
          </div>
          
          <div style={{ padding: '24px' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                    <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                  </tr>
                </thead>
                <tbody>
                  {extraExpenses.map((expense) => (
                    <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                      <td style={{ padding: '12px' }}>{expense.name}</td>
                      <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>
                        {formatCurrency(expense.amount)}
                      </td>
                      <td style={{ padding: '12px' }}>{formatDate(expense.date)}</td>
                      <td style={{ padding: '12px' }}>
                        <span style={{
                          padding: '4px 8px',
                          borderRadius: '12px',
                          fontSize: '0.75rem',
                          fontWeight: '500',
                          background: expense.category === 'weekly' ? '#dcfdf4' : '#dbeafe',
                          color: expense.category === 'weekly' ? '#059669' : '#2563eb'
                        }}>
                          {expense.category}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {!selectedProject && (
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '300px',
          background: 'white',
          borderRadius: '12px',
          boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
        }}>
          <div style={{ textAlign: 'center' }}>
            <DollarSign size={48} style={{ color: '#9ca3af', marginBottom: '16px' }} />
            <h3 style={{ color: '#374151', margin: '0 0 8px 0' }}>No Project Selected</h3>
            <p style={{ color: '#6b7280', margin: '0' }}>
              Please select a project from the dropdown to view budget details
            </p>
          </div>
        </div>
      )}

      {/* Add Project Modal */}
      {showAddProjectModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '400px',
            maxWidth: '90vw'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0', color: '#1f2937' }}>Add New Project</h3>
              <button
                onClick={() => setShowAddProjectModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            <div style={{ padding: '20px' }}>
              <label style={{
                display: 'block',
                marginBottom: '8px',
                fontWeight: '600',
                color: '#374151'
              }}>
                Project Name:
              </label>
              <input
                type="text"
                value={newProjectName}
                onChange={(e) => setNewProjectName(e.target.value)}
                placeholder="Enter project name..."
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  fontSize: '14px',
                  boxSizing: 'border-box'
                }}
              />
            </div>
            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={() => setShowAddProjectModal(false)}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleAddProject}
                disabled={!newProjectName.trim()}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  background: newProjectName.trim() ? '#3b82f6' : '#9ca3af',
                  color: 'white'
                }}
              >
                Add Project
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Expenses Modal */}
      {showAddExpensesModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '500px',
            maxWidth: '90vw'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0', color: '#1f2937' }}>Add Expenses</h3>
              <button
                onClick={resetModals}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>
            
            <div style={{ padding: '20px' }}>
              {!expenseType && (
                <div>
                  <p style={{ marginBottom: '20px', color: '#374151' }}>Choose expense type:</p>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button
                      onClick={() => handleExpenseTypeSelect('projects')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Projects</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Update existing project budgets
                      </div>
                    </button>
                    <button
                      onClick={() => handleExpenseTypeSelect('extraexpensive')}
                      style={{
                        flex: 1,
                        padding: '16px',
                        borderRadius: '8px',
                        border: '2px solid #e5e7eb',
                        background: 'white',
                        cursor: 'pointer',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ fontWeight: '600', marginBottom: '4px' }}>Extra Expenses</div>
                      <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                        Add additional expenses
                      </div>
                    </button>
                  </div>
                </div>
              )}

              {expenseType === 'projects' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Select Project:
                    </label>
                    <select
                      value={selectedExpenseProject}
                      onChange={(e) => setSelectedExpenseProject(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    >
                      <option value="">Choose a project...</option>
                      {projects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                    <div>
                      <label style={{
                        display: 'block',
                        marginBottom: '8px',
                        fontWeight: '600',
                        color: '#374151'
                      }}>
                        Income:
                      </label>
                      <input
                        type="number"
                        value={expenseData.income}
                        onChange={(e) => setExpenseData(prev => ({ ...prev, income: e.target.value }))}
                        placeholder="Enter income..."
                        style={{
                          width: '100%',
                          padding: '10px 16px',
                          border: '2px solid #e5e7eb',
                          borderRadius: '8px',
                          fontSize: '14px',
                          boxSizing: 'border-box'
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {expenseType === 'extraexpensive' && (
                <div>
                  <div style={{ marginBottom: '16px' }}>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Expense Name:
                    </label>
                    <input
                      type="text"
                      value={extraExpenseName}
                      onChange={(e) => setExtraExpenseName(e.target.value)}
                      placeholder="Enter expense name..."
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                  <div>
                    <label style={{
                      display: 'block',
                      marginBottom: '8px',
                      fontWeight: '600',
                      color: '#374151'
                    }}>
                      Amount:
                    </label>
                    <input
                      type="number"
                      value={extraExpenseAmount}
                      onChange={(e) => setExtraExpenseAmount(e.target.value)}
                      placeholder="Enter amount..."
                      style={{
                        width: '100%',
                        padding: '10px 16px',
                        border: '2px solid #e5e7eb',
                        borderRadius: '8px',
                        fontSize: '14px',
                        boxSizing: 'border-box'
                      }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div style={{
              display: 'flex',
              justifyContent: 'flex-end',
              gap: '12px',
              padding: '20px',
              borderTop: '1px solid #e5e7eb'
            }}>
              <button
                onClick={resetModals}
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  border: 'none',
                  background: '#f3f4f6',
                  color: '#374151'
                }}
              >
                Cancel
              </button>
              {expenseType === 'projects' && (
                <button
                  onClick={handleProjectExpenseUpdate}
                  disabled={!selectedExpenseProject || Object.values(expenseData).every(val => val === '')}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: (selectedExpenseProject && Object.values(expenseData).some(val => val !== '')) ? '#3b82f6' : '#9ca3af',
                    color: 'white'
                  }}
                >
                  Update Project
                </button>
              )}
              {expenseType === 'extraexpensive' && (
                <button
                  onClick={handleExtraExpenseAdd}
                  disabled={!extraExpenseName.trim() || !extraExpenseAmount}
                  style={{
                    padding: '8px 16px',
                    borderRadius: '6px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    border: 'none',
                    background: (extraExpenseName.trim() && extraExpenseAmount) ? '#3b82f6' : '#9ca3af',
                    color: 'white'
                  }}
                >
                  Add Expense
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Inventory Modal */}
      {showInventoryModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            borderRadius: '12px',
            width: '800px',
            maxWidth: '90vw',
            maxHeight: '80vh',
            overflow: 'hidden'
          }}>
            <div style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '20px',
              borderBottom: '1px solid #e5e7eb'
            }}>
              <h3 style={{ margin: '0', color: '#1f2937' }}>Inventory - Extra Expenses</h3>
              <button
                onClick={() => setShowInventoryModal(false)}
                style={{
                  background: 'none',
                  border: 'none',
                  fontSize: '24px',
                  cursor: 'pointer',
                  color: '#6b7280'
                }}
              >
                ×
              </button>
            </div>

            <div style={{ padding: '20px' }}>
              {/* Filter Controls */}
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                marginBottom: '20px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px'
              }}>
                <Filter size={20} style={{ color: '#6b7280' }} />
                <span style={{ fontWeight: '600', color: '#374151' }}>Filter by:</span>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button
                    onClick={() => setInventoryFilter('all')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      background: inventoryFilter === 'all' ? '#3b82f6' : '#e5e7eb',
                      color: inventoryFilter === 'all' ? 'white' : '#374151'
                    }}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setInventoryFilter('weekly')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      background: inventoryFilter === 'weekly' ? '#3b82f6' : '#e5e7eb',
                      color: inventoryFilter === 'weekly' ? 'white' : '#374151'
                    }}
                  >
                    Weekly
                  </button>
                  <button
                    onClick={() => setInventoryFilter('monthly')}
                    style={{
                      padding: '6px 12px',
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      fontWeight: '500',
                      background: inventoryFilter === 'monthly' ? '#3b82f6' : '#e5e7eb',
                      color: inventoryFilter === 'monthly' ? 'white' : '#374151'
                    }}
                  >
                    Monthly
                  </button>
                </div>
              </div>

              {/* Inventory Table */}
              <div style={{ overflowY: 'auto', maxHeight: '400px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead style={{ position: 'sticky', top: 0, background: 'white' }}>
                    <tr style={{ borderBottom: '2px solid #e5e7eb' }}>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Name</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Amount</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Date</th>
                      <th style={{ padding: '12px', textAlign: 'left', fontWeight: '600' }}>Category</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredExtraExpenses().map((expense) => (
                      <tr key={expense.id} style={{ borderBottom: '1px solid #f3f4f6' }}>
                        <td style={{ padding: '12px' }}>{expense.name}</td>
                        <td style={{ padding: '12px', fontWeight: '600', color: '#ef4444' }}>
                          {formatCurrency(expense.amount)}
                        </td>
                        <td style={{ padding: '12px' }}>{formatDate(expense.date)}</td>
                        <td style={{ padding: '12px' }}>
                          <span style={{
                            padding: '4px 8px',
                            borderRadius: '12px',
                            fontSize: '0.75rem',
                            fontWeight: '500',
                            background: expense.category === 'weekly' ? '#dcfdf4' : '#dbeafe',
                            color: expense.category === 'weekly' ? '#059669' : '#2563eb'
                          }}>
                            {expense.category}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                
                {getFilteredExtraExpenses().length === 0 && (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    color: '#6b7280'
                  }}>
                    <Package size={48} style={{ marginBottom: '16px', opacity: 0.5 }} />
                    <p>No expenses found for the selected filter.</p>
                  </div>
                )}
              </div>

              {/* Summary */}
              <div style={{
                marginTop: '20px',
                padding: '16px',
                background: '#f9fafb',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center'
              }}>
                <span style={{ fontWeight: '600', color: '#374151' }}>
                  Total Expenses ({inventoryFilter === 'all' ? 'All' : inventoryFilter}):
                </span>
                <span style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ef4444' }}>
                  {formatCurrency(
                    getFilteredExtraExpenses().reduce((sum, expense) => sum + expense.amount, 0)
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBudgeting;