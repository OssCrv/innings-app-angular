import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { UserService, User, UserRole } from './services/user.service';

interface FeedbackMessage {
  type: 'success' | 'error';
  message: string;
}

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  private readonly userService = inject(UserService);
  private readonly fb = inject(FormBuilder);

  protected readonly roles: ReadonlyArray<UserRole> = ['ADMIN', 'USUARIO'];

  protected readonly users = signal<User[]>([]);
  protected readonly loadingUsers = signal(false);
  protected readonly loadError = signal<string | null>(null);
  protected readonly submitting = signal(false);
  protected readonly submissionFeedback = signal<FeedbackMessage | null>(null);
  protected readonly formSubmitted = signal(false);

  protected readonly userForm = this.fb.nonNullable.group({
    username: this.fb.nonNullable.control('', [Validators.required, Validators.maxLength(50)]),
    password: this.fb.nonNullable.control('', [Validators.required, Validators.minLength(8), Validators.maxLength(255)]),
    firstName: this.fb.control<string | null>('', [Validators.maxLength(100)]),
    role: this.fb.nonNullable.control<UserRole>('USUARIO', [Validators.required])
  });

  ngOnInit(): void {
    this.loadUsers();
  }

  protected loadUsers(): void {
    this.loadingUsers.set(true);
    this.loadError.set(null);

    this.userService.getUsers().subscribe({
      next: (users: User[]) => {
        this.users.set(users);
        this.loadingUsers.set(false);
      },
      error: () => {
        this.loadError.set('No se pudieron cargar los usuarios. Inténtalo nuevamente.');
        this.loadingUsers.set(false);
      }
    });
  }

  protected submit(): void {
    this.formSubmitted.set(true);
    this.submissionFeedback.set(null);

    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    const formValue = this.userForm.getRawValue();
    const payload = {
      username: formValue.username.trim(),
      password: formValue.password,
      firstName: formValue.firstName?.trim() || undefined,
      role: formValue.role
    } as const;

    this.submitting.set(true);

    this.userService.createUser(payload).subscribe({
      next: (user: User) => {
        this.submissionFeedback.set({
          type: 'success',
          message: `El usuario "${user.username}" fue creado correctamente.`
        });
        this.userForm.reset({ role: 'USUARIO' });
        this.formSubmitted.set(false);
        this.submitting.set(false);
        this.loadUsers();
      },
      error: () => {
        this.submissionFeedback.set({
          type: 'error',
          message: 'No se pudo crear el usuario. Revisa los datos e inténtalo nuevamente.'
        });
        this.submitting.set(false);
      }
    });
  }

  protected dismissFeedback(): void {
    this.submissionFeedback.set(null);
  }

  protected showError(controlName: 'username' | 'password' | 'firstName'): boolean {
    const control = this.userForm.get(controlName);
    return !!control && control.invalid && (control.touched || this.formSubmitted());
  }

  protected canSubmit(): boolean {
    return this.userForm.valid && !this.submitting();
  }

  protected trackByUserId(_: number, user: User): number {
    return user.id;
  }
}
