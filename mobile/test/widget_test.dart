import 'package:acadintern_student_mobile/src/app.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('renders login gate for signed-out session',
      (WidgetTester tester) async {
    await tester.pumpWidget(
      const ProviderScope(
        child: AcadInternStudentApp(),
      ),
    );
    await tester.pumpAndSettle();

    expect(find.text('Student Login'), findsOneWidget);
  });
}
