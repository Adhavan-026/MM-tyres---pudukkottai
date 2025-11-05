// Booking System Logic

const TIME_SLOTS = ['9-11 AM', '11-1 PM', '2-4 PM', '4-6 PM'];
const MAX_SLOTS_PER_TIME = 3; // Maximum bookings per time slot

// Check slot availability for selected date
async function checkAvailability() {
    const dateInput = document.getElementById('bookingDate');
    const selectedDate = dateInput.value;
    
    if (!selectedDate) return;

    const slotsContainer = document.getElementById('slotsContainer');
    slotsContainer.innerHTML = '<p>Checking availability...</p>';

    try {
        // Get existing bookings for the selected date
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('booking_slot')
            .eq('booking_date', selectedDate)
            .neq('status', 'cancelled');

        if (error) throw error;

        // Count bookings per slot
        const slotCounts = {};
        TIME_SLOTS.forEach(slot => slotCounts[slot] = 0);
        
        bookings.forEach(booking => {
            if (slotCounts[booking.booking_slot] !== undefined) {
                slotCounts[booking.booking_slot]++;
            }
        });

        // Display available slots
        slotsContainer.innerHTML = '<h4>Available Time Slots:</h4>';
        const slotsHTML = TIME_SLOTS.map(slot => {
            const booked = slotCounts[slot];
            const available = MAX_SLOTS_PER_TIME - booked;
            const disabled = available === 0;

            return `
                <label class="slot-option ${disabled ? 'disabled' : ''}">
                    <input type="radio" name="timeSlot" value="${slot}" 
                           ${disabled ? 'disabled' : ''} required>
                    <span>${slot} ${disabled ? '(Full)' : `(${available} slots available)`}</span>
                </label>
            `;
        }).join('');

        slotsContainer.innerHTML += slotsHTML;

    } catch (error) {
        console.error('Error checking availability:', error);
        slotsContainer.innerHTML = '<p>Error checking availability. Please try again.</p>';
    }
}

// Create new booking
async function createBooking(e) {
    e.preventDefault();

    const user = await getCurrentUser();
    if (!user) {
        alert('Please login to book an appointment');
        window.location.href = 'auth.html';
        return;
    }

    const customerName = document.getElementById('customerName').value;
    const customerPhone = document.getElementById('customerPhone').value;
    const vehicleNumber = document.getElementById('vehicleNumber').value.toUpperCase();
    const vehicleType = document.getElementById('vehicleType').value;
    const serviceType = document.getElementById('serviceType').value;
    const bookingDate = document.getElementById('bookingDate').value;
    const notes = document.getElementById('notes').value;

    // Get selected time slot
    const selectedSlot = document.querySelector('input[name="timeSlot"]:checked');
    if (!selectedSlot) {
        alert('Please select a time slot');
        return;
    }

    const bookingData = {
        user_id: user.id,
        customer_name: customerName,
        customer_phone: customerPhone,
        vehicle_number: vehicleNumber,
        vehicle_type: vehicleType,
        service_type: serviceType,
        booking_date: bookingDate,
        booking_slot: selectedSlot.value,
        status: 'pending',
        notes: notes,
        created_at: new Date().toISOString()
    };

    try {
        document.getElementById('bookBtn').disabled = true;
        document.getElementById('bookBtn').textContent = 'Booking...';

        const { data, error } = await supabase
            .from('bookings')
            .insert([bookingData])
            .select();

        if (error) throw error;

        alert('Booking confirmed! Booking ID: ' + data[0].id);
        document.getElementById('bookingForm').reset();
        showTab('history');
    } catch (error) {
        console.error('Error creating booking:', error);
        alert('Error creating booking: ' + error.message);
    } finally {
        document.getElementById('bookBtn').disabled = false;
        document.getElementById('bookBtn').textContent = 'Book Appointment';
    }
}

// Load booking history
async function loadBookingHistory() {
    const user = await getCurrentUser();
    if (!user) {
        document.getElementById('bookingsList').innerHTML = '<p>Please login to view bookings. <a href="auth.html">Login</a></p>';
        return;
    }

    const bookingsList = document.getElementById('bookingsList');
    bookingsList.innerHTML = '<p>Loading bookings...</p>';

    try {
        const { data: bookings, error } = await supabase
            .from('bookings')
            .select('*')
            .eq('user_id', user.id)
            .order('booking_date', { ascending: false });

        if (error) throw error;

        if (bookings.length === 0) {
            bookingsList.innerHTML = '<p>No bookings found. <a href="#" onclick="showTab(\'new\')">Book now</a></p>';
            return;
        }

        bookingsList.innerHTML = bookings.map(booking => `
            <div class="booking-card ${booking.status}">
                <div class="booking-header">
                    <h4>Booking #${booking.id.substring(0, 8)}</h4>
                    <span class="status-badge ${booking.status}">${booking.status.toUpperCase()}</span>
                </div>
                <div class="booking-details">
                    <p><strong>Date:</strong> ${new Date(booking.booking_date).toLocaleDateString()}</p>
                    <p><strong>Time:</strong> ${booking.booking_slot}</p>
                    <p><strong>Vehicle:</strong> ${booking.vehicle_number} (${booking.vehicle_type})</p>
                    <p><strong>Service:</strong> ${booking.service_type}</p>
                    ${booking.notes ? `<p><strong>Notes:</strong> ${booking.notes}</p>` : ''}
                    <p><strong>Booked on:</strong> ${new Date(booking.created_at).toLocaleString()}</p>
                </div>
                ${booking.status === 'pending' ? `
                    <button onclick="cancelBooking('${booking.id}')" class="btn-cancel">Cancel Booking</button>
                ` : ''}
            </div>
        `).join('');

    } catch (error) {
        console.error('Error loading bookings:', error);
        bookingsList.innerHTML = '<p>Error loading bookings. Please refresh.</p>';
    }
}

// Cancel booking
async function cancelBooking(bookingId) {
    if (!confirm('Are you sure you want to cancel this booking?')) {
        return;
    }

    try {
        const { error } = await supabase
            .from('bookings')
            .update({ status: 'cancelled' })
            .eq('id', bookingId);

        if (error) throw error;

        alert('Booking cancelled successfully');
        loadBookingHistory();
    } catch (error) {
        console.error('Error cancelling booking:', error);
        alert('Error cancelling booking: ' + error.message);
    }
}